import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SwitchState {
    mode: 'OFF' | 'PULSE' | 'CONTINUOUS';
    pulseIntervalSeconds: number;
    pulseOnMillis: number;
    validUntil: string | null;
    isActive: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class SwitchService {
    private currentStateSubject = new BehaviorSubject<SwitchState | null>(null);
    public currentState$ = this.currentStateSubject.asObservable();

    private defaultDeviceId = 'default'; // Will be set from device list

    constructor(private http: HttpClient) {
        // Poll for state every 5 seconds
        interval(5000)
            .pipe(switchMap(() => this.fetchCurrentState()))
            .subscribe();
    }

    setDefaultDevice(deviceId: string) {
        this.defaultDeviceId = deviceId;
    }

    fetchCurrentState(): Observable<SwitchState> {
        return this.http
            .get<SwitchState>(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state`)
            .pipe(
                tap((state) => {
                    this.currentStateSubject.next(state);
                })
            );
    }

    enableManual(durationMinutes?: number): Observable<any> {
        const body: any = {
            mode: 'PULSE',
            pulseIntervalSeconds: 10,
            pulseOnMillis: 500,
        };

        if (durationMinutes) {
            const validUntil = new Date();
            validUntil.setMinutes(validUntil.getMinutes() + durationMinutes);
            body.validUntil = validUntil.toISOString();
        }

        return this.http
            .post(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state/manual`, body)
            .pipe(tap(() => this.fetchCurrentState().subscribe()));
    }

    disable(): Observable<any> {
        return this.http
            .post(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state/manual`, {
                mode: 'OFF',
            })
            .pipe(tap(() => this.fetchCurrentState().subscribe()));
    }

    enableAutoGPS(): Observable<any> {
        return this.http
            .post(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state/auto`, {
                trigger: 'GPS',
                durationMinutes: 20,
            })
            .pipe(tap(() => this.fetchCurrentState().subscribe()));
    }

    enableAutoWiFi(): Observable<any> {
        return this.http
            .post(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state/auto`, {
                trigger: 'WIFI',
                durationMinutes: 10,
            })
            .pipe(tap(() => this.fetchCurrentState().subscribe()));
    }

    getTimeRemaining(): number | null {
        const state = this.currentStateSubject.value;
        if (!state || !state.validUntil || !state.isActive) {
            return null;
        }

        const now = new Date().getTime();
        const validUntil = new Date(state.validUntil).getTime();
        const remaining = validUntil - now;

        return remaining > 0 ? remaining : null;
    }
}

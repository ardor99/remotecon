import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, EMPTY } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
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

    private defaultDeviceId: string | null = null;

    constructor(private http: HttpClient) {
        this.loadDefaultDevice();
        this.startPolling();
    }

    setDefaultDevice(deviceId: string) {
        this.defaultDeviceId = deviceId;
    }

    private startPolling() {
        interval(5000)
            .pipe(
                switchMap(() => this.fetchCurrentState()),
            )
            .subscribe();
    }

    private loadDefaultDevice() {
        this.http.get<any[]>(`${environment.apiUrl}/devices`)
            .pipe(
                tap((devices) => {
                    if (!devices?.length) {
                        console.warn('No devices available for current user; skipping switch polling.');
                        return;
                    }
                    if (!this.defaultDeviceId) {
                        this.defaultDeviceId = devices[0].id;
                        this.fetchCurrentState().subscribe();
                    }
                }),
                catchError((err) => {
                    console.error('Failed to load devices for polling', err);
                    return EMPTY;
                })
            )
            .subscribe();
    }

    fetchCurrentState(): Observable<SwitchState> {
        if (!this.defaultDeviceId) {
            return EMPTY as unknown as Observable<SwitchState>;
        }

        return this.http
            .get<SwitchState>(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state`)
            .pipe(
                tap((state) => {
                    this.currentStateSubject.next(state);
                }),
                catchError((err) => {
                    console.error('Error fetching switch state', err);
                    return EMPTY;
                })
            );
    }

    enableManual(durationMinutes?: number): Observable<any> {
        if (!this.defaultDeviceId) {
            console.warn('No device selected; unable to send manual command.');
            return EMPTY;
        }

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
        if (!this.defaultDeviceId) {
            console.warn('No device selected; unable to disable.');
            return EMPTY;
        }

        return this.http
            .post(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state/manual`, {
                mode: 'OFF',
            })
            .pipe(tap(() => this.fetchCurrentState().subscribe()));
    }

    enableAutoGPS(): Observable<any> {
        if (!this.defaultDeviceId) {
            console.warn('No device selected; unable to trigger GPS auto-unlock.');
            return EMPTY;
        }

        return this.http
            .post(`${environment.apiUrl}/devices/${this.defaultDeviceId}/state/auto`, {
                trigger: 'GPS',
                durationMinutes: 20,
            })
            .pipe(tap(() => this.fetchCurrentState().subscribe()));
    }

    enableAutoWiFi(): Observable<any> {
        if (!this.defaultDeviceId) {
            console.warn('No device selected; unable to trigger WiFi auto-unlock.');
            return EMPTY;
        }

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

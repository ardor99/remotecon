import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';

export interface UserSettings {
    homeLatitude?: number;
    homeLongitude?: number;
    homeRadiusMeters?: number;
    homeWifiSsids?: string[];
}

@Injectable({
    providedIn: 'root',
})
export class GeofencingService {
    private isInsideGeofence = new BehaviorSubject<boolean>(false);
    public isInsideGeofence$ = this.isInsideGeofence.asObservable();

    private wasInsideGeofence = false;
    private settings: UserSettings | null = null;
    private watchId: string | null = null;

    constructor() { }

    async initializeGeofencing(settings: UserSettings) {
        this.settings = settings;

        // Only works on mobile
        if (!Capacitor.isNativePlatform()) {
            console.log('Geofencing is only available on mobile platforms');
            return;
        }

        // Request permissions
        try {
            const permission = await Geolocation.requestPermissions();
            if (permission.location !== 'granted') {
                console.error('Location permission not granted');
                return;
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            return;
        }

        // Start watching position
        this.watchId = await Geolocation.watchPosition(
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 30000,
            },
            (position, err) => {
                if (err) {
                    console.error('Geolocation error:', err);
                    return;
                }
                if (position) {
                    this.checkGeofence(position);
                }
            }
        );
    }

    stopGeofencing() {
        if (this.watchId) {
            Geolocation.clearWatch({ id: this.watchId });
            this.watchId = null;
        }
    }

    private checkGeofence(position: Position) {
        if (!this.settings?.homeLatitude || !this.settings?.homeLongitude) {
            return;
        }

        const distance = this.calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            this.settings.homeLatitude,
            this.settings.homeLongitude
        );

        const radius = this.settings.homeRadiusMeters || 200;
        const isInside = distance <= radius;

        // Detect entering geofence
        if (isInside && !this.wasInsideGeofence) {
            this.onGeofenceEnter();
        }

        this.wasInsideGeofence = isInside;
        this.isInsideGeofence.next(isInside);
    }

    private onGeofenceEnter() {
        console.log('Entered home geofence');
        // This will be handled by the component/service that subscribes to geofence events
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        // Haversine formula
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    async getCurrentLocation(): Promise<Position | null> {
        try {
            const position = await Geolocation.getCurrentPosition();
            return position;
        } catch (error) {
            console.error('Error getting current location:', error);
            return null;
        }
    }
}

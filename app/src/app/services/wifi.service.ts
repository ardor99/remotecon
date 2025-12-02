import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WifiService {
    private connectedToHomeWifi = new BehaviorSubject<boolean>(false);
    public connectedToHomeWifi$ = this.connectedToHomeWifi.asObservable();

    private wasConnected = false;
    private homeSSIDs: string[] = [];

    constructor() { }

    async initializeWifiMonitoring(homeSSIDs: string[]) {
        this.homeSSIDs = homeSSIDs;

        // Only works on mobile
        if (!Capacitor.isNativePlatform()) {
            console.log('WiFi monitoring is only available on mobile platforms');
            return;
        }

        // Listen for network status changes
        Network.addListener('networkStatusChange', (status) => {
            this.checkWifiConnection(status);
        });

        // Check initial state
        const status = await Network.getStatus();
        this.checkWifiConnection(status);
    }

    private checkWifiConnection(status: any) {
        // Note: Getting SSID is limited on iOS and Android
        // On Android 10+, requires location permission
        // On iOS, requires special entitlements
        // For now, we just check if connected to WiFi
        const isWifi = status.connectionType === 'wifi';

        // Detect connecting to WiFi
        if (isWifi && !this.wasConnected) {
            this.onWifiConnected();
        }

        this.wasConnected = isWifi;
        this.connectedToHomeWifi.next(isWifi);

        // In a real implementation, you would use @capacitor-community/network-info
        // to get the actual SSID and compare it to homeSSIDs
    }

    private onWifiConnected() {
        console.log('Connected to WiFi');
        // This will be handled by the component/service that subscribes to WiFi events
    }

    stopWifiMonitoring() {
        Network.removeAllListeners();
    }
}

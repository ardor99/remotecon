import { Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
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
        this.homeSSIDs = homeSSIDs || [];

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
        await this.checkWifiConnection(status);
    }

    private async checkWifiConnection(status: ConnectionStatus) {
        const isWifi = status.connectionType === 'wifi';

        if (!isWifi) {
            this.wasConnected = false;
            this.connectedToHomeWifi.next(false);
            return;
        }

        const ssid = await this.getCurrentSsid(status);
        const isHome = !!ssid && this.homeSSIDs.includes(ssid);

        // Detect connecting to a trusted WiFi
        if (isHome && !this.wasConnected) {
            this.onWifiConnected();
        }

        this.wasConnected = isHome;
        this.connectedToHomeWifi.next(isHome);
    }

    private onWifiConnected() {
        console.log('Connected to WiFi');
        // This will be handled by the component/service that subscribes to WiFi events
    }

    private async getCurrentSsid(status: ConnectionStatus): Promise<string | null> {
        try {
            // Capacitor Network API does not expose SSID directly; some platforms
            // may provide it via status (vendor-specific). If unavailable, we fail
            // closed and do not auto-unlock.
            const ssid = (status as any)?.ssid || null;

            if (!ssid) {
                console.warn('Unable to read WiFi SSID; will not enable auto-unlock.');
            }

            return ssid;
        } catch (error) {
            console.error('Error retrieving WiFi SSID', error);
            return null;
        }
    }

    stopWifiMonitoring() {
        Network.removeAllListeners();
    }
}

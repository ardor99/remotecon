import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { GeofencingService } from '../../services/geofencing.service';
import { WifiService } from '../../services/wifi.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
    homeLatitude: number | null = null;
    homeLongitude: number | null = null;
    homeRadiusMeters = 200;
    homeWifiSsids: string[] = [];
    newSsid = '';

    constructor(
        private http: HttpClient,
        private geofencingService: GeofencingService,
        private wifiService: WifiService,
        private alertController: AlertController
    ) { }

    ngOnInit() {
        this.loadSettings();
    }

    loadSettings() {
        this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({
            next: (response) => {
                if (response.userSettings) {
                    this.homeLatitude = response.userSettings.homeLatitude;
                    this.homeLongitude = response.userSettings.homeLongitude;
                    this.homeRadiusMeters = response.userSettings.homeRadiusMeters || 200;
                    this.homeWifiSsids = response.userSettings.homeWifiSsids || [];
                }
            },
            error: (err) => console.error('Error loading settings:', err),
        });
    }

    async setCurrentLocation() {
        const position = await this.geofencingService.getCurrentLocation();
        if (position) {
            this.homeLatitude = position.coords.latitude;
            this.homeLongitude = position.coords.longitude;
        }
    }

    addWifiSsid() {
        if (this.newSsid && !this.homeWifiSsids.includes(this.newSsid)) {
            this.homeWifiSsids.push(this.newSsid);
            this.newSsid = '';
        }
    }

    removeWifiSsid(ssid: string) {
        this.homeWifiSsids = this.homeWifiSsids.filter((s) => s !== ssid);
    }

    async saveSettings() {
        const settings = {
            homeLatitude: this.homeLatitude ?? undefined,
            homeLongitude: this.homeLongitude ?? undefined,
            homeRadiusMeters: this.homeRadiusMeters,
            homeWifiSsids: this.homeWifiSsids,
        };

        this.http.patch(`${environment.apiUrl}/users/me/settings`, settings).subscribe({
            next: async () => {
                // Update services
                if (this.homeLatitude !== null && this.homeLongitude !== null) {
                    this.geofencingService.initializeGeofencing(settings);
                }
                this.wifiService.initializeWifiMonitoring(this.homeWifiSsids);

                const alert = await this.alertController.create({
                    header: 'Success',
                    message: 'Settings saved successfully',
                    buttons: ['OK'],
                });
                await alert.present();
            },
            error: async (err) => {
                const alert = await this.alertController.create({
                    header: 'Error',
                    message: 'Failed to save settings',
                    buttons: ['OK'],
                });
                await alert.present();
            },
        });
    }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { SwitchService, SwitchState } from '../../services/switch.service';
import { GeofencingService } from '../../services/geofencing.service';
import { WifiService } from '../../services/wifi.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
    currentUser: User | null = null;
    switchState: SwitchState | null = null;
    remainingTime = '';
    gpsAutoEnabled = false;
    wifiAutoEnabled = false;

    private subscriptions: Subscription[] = [];

    constructor(
        private authService: AuthService,
        private switchService: SwitchService,
        private geofencingService: GeofencingService,
        private wifiService: WifiService,
        private notificationService: NotificationService,
        private router: Router
    ) { }

    ngOnInit() {
        this.currentUser = this.authService.getCurrentUser();

        // Subscribe to switch state changes
        this.subscriptions.push(
            this.switchService.currentState$.subscribe((state) => {
                this.switchState = state;
                this.updateNotification();
            })
        );

        // Update remaining time every second
        this.subscriptions.push(
            interval(1000).subscribe(() => {
                this.updateRemainingTime();
            })
        );

        // Initial state fetch
        this.switchService.fetchCurrentState().subscribe();

        // Listen for geofence entry
        this.subscriptions.push(
            this.geofencingService.isInsideGeofence$.subscribe((isInside) => {
                if (isInside && this.gpsAutoEnabled) {
                    this.switchService.enableAutoGPS().subscribe();
                }
            })
        );

        // Listen for WiFi connection
        this.subscriptions.push(
            this.wifiService.connectedToHomeWifi$.subscribe((isConnected) => {
                if (isConnected && this.wifiAutoEnabled) {
                    this.switchService.enableAutoWiFi().subscribe();
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    enableSwitch() {
        this.switchService.enableManual().subscribe({
            next: () => console.log('Switch enabled'),
            error: (err) => console.error('Error enabling switch:', err),
        });
    }

    disableSwitch() {
        this.switchService.disable().subscribe({
            next: () => {
                console.log('Switch disabled');
                this.notificationService.cancelNotification();
            },
            error: (err) => console.error('Error disabling switch:', err),
        });
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    private updateRemainingTime() {
        const remaining = this.switchService.getTimeRemaining();
        if (remaining !== null) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            this.remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            this.remainingTime = '';
        }
    }

    private updateNotification() {
        if (this.switchState?.isActive) {
            const remaining = this.switchService.getTimeRemaining();
            if (remaining !== null) {
                const minutes = Math.ceil(remaining / 60000);
                this.notificationService.showSwitchActiveNotification(minutes);
            }
        } else {
            this.notificationService.cancelNotification();
        }
    }
}

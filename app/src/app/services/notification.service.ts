import { Injectable } from '@angular/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { SwitchService } from './switch.service';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private notificationId = 1;

    constructor(private switchService: SwitchService) { }

    async initialize() {
        if (!Capacitor.isNativePlatform()) {
            console.log('Notifications are only available on mobile platforms');
            return;
        }

        // Request permissions
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== 'granted') {
            console.error('Notification permission not granted');
            return;
        }

        // Listen for notification actions
        await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
            if (notification.actionId === 'turn_off') {
                this.switchService.disable().subscribe({
                    next: () => {
                        console.log('Switch turned off from notification');
                        this.cancelNotification();
                    },
                    error: (err) => console.error('Error turning off switch:', err),
                });
            }
        });
    }

    async showSwitchActiveNotification(remainingMinutes: number) {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const notifications: LocalNotificationSchema[] = [
            {
                id: this.notificationId,
                title: 'Elevator Switch Active',
                body: `Switch is ON. Remaining time: ${remainingMinutes} minutes`,
                smallIcon: 'ic_stat_icon',
                ongoing: true, // Makes it persistent
                autoCancel: false,
                extra: {
                    action: 'switch_active',
                },
            },
        ];

        await LocalNotifications.schedule({ notifications });
    }

    async updateNotification(remainingMinutes: number) {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        await this.showSwitchActiveNotification(remainingMinutes);
    }

    async cancelNotification() {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        await LocalNotifications.cancel({ notifications: [{ id: this.notificationId }] });
    }
}

import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { NotificationService } from './services/notification.service';

@Component({
    selector: 'app-root',
    template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
    styles: []
})
export class AppComponent implements OnInit {
    constructor(
        private platform: Platform,
        private notificationService: NotificationService
    ) { }

    ngOnInit() {
        this.platform.ready().then(() => {
            this.notificationService.initialize();
        });
    }
}

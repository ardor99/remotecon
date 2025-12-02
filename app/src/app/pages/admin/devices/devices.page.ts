import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-devices',
    templateUrl: './devices.page.html',
    styleUrls: ['./devices.page.scss'],
})
export class DevicesPage implements OnInit {
    devices: any[] = [];

    constructor(private http: HttpClient) { }

    ngOnInit() {
        this.loadDevices();
    }

    loadDevices() {
        this.http.get<any[]>(`${environment.apiUrl}/admin/devices`).subscribe({
            next: (devices) => {
                this.devices = devices;
            },
            error: (err) => console.error('Error loading devices:', err),
        });
    }

    formatDate(date: string | null): string {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    }
}

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-users',
    templateUrl: './users.page.html',
    styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnInit {
    users: any[] = [];
    filter: 'all' | 'pending' | 'approved' = 'pending';

    constructor(
        private http: HttpClient,
        private alertController: AlertController
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.http.get<any[]>(`${environment.apiUrl}/admin/users`).subscribe({
            next: (users) => {
                this.users = users;
            },
            error: (err) => console.error('Error loading users:', err),
        });
    }

    get filteredUsers() {
        if (this.filter === 'pending') {
            return this.users.filter((u) => !u.isApproved);
        } else if (this.filter === 'approved') {
            return this.users.filter((u) => u.isApproved);
        }
        return this.users;
    }

    async approveUser(userId: string) {
        this.http.patch(`${environment.apiUrl}/admin/users/${userId}/approve`, {}).subscribe({
            next: async () => {
                this.loadUsers();
                const alert = await this.alertController.create({
                    header: 'Success',
                    message: 'User approved successfully',
                    buttons: ['OK'],
                });
                await alert.present();
            },
            error: async (err) => {
                const alert = await this.alertController.create({
                    header: 'Error',
                    message: 'Failed to approve user',
                    buttons: ['OK'],
                });
                await alert.present();
            },
        });
    }

    async rejectUser(userId: string) {
        this.http.patch(`${environment.apiUrl}/admin/users/${userId}/reject`, {}).subscribe({
            next: async () => {
                this.loadUsers();
                const alert = await this.alertController.create({
                    header: 'Success',
                    message: 'User rejected',
                    buttons: ['OK'],
                });
                await alert.present();
            },
            error: async (err) => {
                const alert = await this.alertController.create({
                    header: 'Error',
                    message: 'Failed to reject user',
                    buttons: ['OK'],
                });
                await alert.present();
            },
        });
    }
}

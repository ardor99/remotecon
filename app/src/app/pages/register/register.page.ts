import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
    email = '';
    password = '';
    confirmPassword = '';
    loading = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController
    ) { }

    async register() {
        if (!this.email || !this.password || !this.confirmPassword) {
            this.showAlert('Error', 'Please fill in all fields');
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.showAlert('Error', 'Passwords do not match');
            return;
        }

        if (this.password.length < 8) {
            this.showAlert('Error', 'Password must be at least 8 characters long');
            return;
        }

        this.loading = true;
        this.authService.register(this.email, this.password).subscribe({
            next: async (response) => {
                this.loading = false;
                const alert = await this.alertController.create({
                    header: 'Registration Successful',
                    message: 'Your account has been created. Please wait for admin approval before logging in.',
                    buttons: [{
                        text: 'OK',
                        handler: () => {
                            this.router.navigate(['/login']);
                        }
                    }],
                });
                await alert.present();
            },
            error: async (error) => {
                this.loading = false;
                const message = error.error?.message || 'Registration failed';
                await this.showAlert('Registration Failed', message);
            },
        });
    }

    private async showAlert(header: string, message: string) {
        const alert = await this.alertController.create({
            header,
            message,
            buttons: ['OK'],
        });
        await alert.present();
    }
}

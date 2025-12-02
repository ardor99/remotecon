import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage {
    email = '';
    password = '';
    loading = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController
    ) { }

    async login() {
        if (!this.email || !this.password) {
            this.showAlert('Error', 'Please enter email and password');
            return;
        }

        this.loading = true;
        this.authService.login(this.email, this.password).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/home']);
            },
            error: async (error) => {
                this.loading = false;
                const message = error.error?.message || 'Login failed. Please check your credentials.';
                await this.showAlert('Login Failed', message);
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

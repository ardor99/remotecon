import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
    id: string;
    email: string;
    role: string;
    isApproved: boolean;
}

interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadStoredUser();
    }

    private loadStoredUser() {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                this.currentUserSubject.next(JSON.parse(userStr));
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
    }

    register(email: string, password: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/register`, {
            email,
            password,
        });
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http
            .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
                email,
                password,
            })
            .pipe(
                tap((response) => {
                    this.setSession(response);
                })
            );
    }

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    refreshToken(): Observable<any> {
        const refreshToken = localStorage.getItem('refreshToken');
        return this.http
            .post<any>(`${environment.apiUrl}/auth/refresh`, {
                refreshToken,
            })
            .pipe(
                tap((response) => {
                    localStorage.setItem('accessToken', response.accessToken);
                    localStorage.setItem('refreshToken', response.refreshToken);
                })
            );
    }

    private setSession(authResult: AuthResponse) {
        localStorage.setItem('accessToken', authResult.accessToken);
        localStorage.setItem('refreshToken', authResult.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(authResult.user));
        this.currentUserSubject.next(authResult.user);
    }

    getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'ADMIN';
    }
}

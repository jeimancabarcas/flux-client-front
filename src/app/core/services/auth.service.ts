import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'user_data';

    // Signals for reactive state management
    private readonly currentUserSignal = signal<User | null>(this.getUserFromStorage());
    private readonly isAuthenticatedSignal = signal<boolean>(this.hasToken());

    // Public computed signals
    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
    readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);
    readonly userDetails = computed(() => this.currentUserSignal()?.detalles ?? null);
    readonly userName = computed(() => {
        const detalles = this.currentUserSignal()?.detalles;
        return detalles ? `${detalles.nombre} ${detalles.apellido}` : null;
    });

    // API endpoint from environment
    private readonly API_URL = environment.apiUrl;

    /**
     * Authenticate user with email and password
     */
    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.handleLoginSuccess(response);
                    }
                })
            );
    }

    /**
     * Logout user and clear session
     */
    logout(): void {
        this.clearSession();
        this.router.navigate(['/login']);
    }

    /**
     * Get stored JWT token
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Check if user has valid token
     */
    private hasToken(): boolean {
        return !!this.getToken();
    }

    /**
     * Handle successful login
     */
    private handleLoginSuccess(response: LoginResponse): void {
        const { access_token, user } = response.data;

        // Store JWT token
        localStorage.setItem(this.TOKEN_KEY, access_token);

        // Store user data
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        // Update signals
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
    }

    /**
     * Clear session data
     */
    private clearSession(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);

        this.currentUserSignal.set(null);
        this.isAuthenticatedSignal.set(false);
    }

    /**
     * Retrieve user data from storage
     */
    private getUserFromStorage(): User | null {
        const userData = localStorage.getItem(this.USER_KEY);
        if (!userData) return null;

        try {
            return JSON.parse(userData) as User;
        } catch {
            return null;
        }
    }
}

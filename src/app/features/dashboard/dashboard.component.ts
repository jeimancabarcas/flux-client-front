import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Component({
    selector: 'app-dashboard',
    imports: [],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    protected readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    // Expose UserRole enum to template
    protected readonly UserRole = UserRole;

    /**
     * Handle logout
     */
    protected onLogout(): void {
        this.authService.logout();
    }

    /**
     * Navigate to appointments
     */
    protected goToAppointments(): void {
        this.router.navigate(['/appointments']);
    }
}

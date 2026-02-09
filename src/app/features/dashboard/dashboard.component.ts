import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { LogoComponent } from '../../shared/components/molecules/logo/logo.component';
import { SidebarComponent } from '../../shared/components/organisms/sidebar/sidebar.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [LogoComponent, SidebarComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    protected readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly isSidebarOpen = signal(false);

    // Expose UserRole enum to template
    protected readonly UserRole = UserRole;

    /**
     * Toggle sidebar for mobile
     */
    protected toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }

    /**
     * Navigate to users management (Admin only)
     */
    protected goToUsers(): void {
        this.router.navigate(['/admin/users']);
    }

    /**
     * Navigate to appointments
     */
    protected goToAppointments(): void {
        this.router.navigate(['/appointments']);
    }

    protected onLogout(): void {
        this.authService.logout();
    }
}

import { Component, inject, signal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/user.model';
import { LogoComponent } from '../../molecules/logo/logo.component';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, LogoComponent],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
    protected readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    isOpen = input<boolean>(false);
    toggle = output<void>();

    protected readonly UserRole = UserRole;

    protected navigate(path: string): void {
        this.router.navigate([path]);
        this.toggle.emit();
    }

    protected onLogout(): void {
        this.authService.logout();
    }
}

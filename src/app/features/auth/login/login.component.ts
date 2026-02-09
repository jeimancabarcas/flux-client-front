import { Component, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../../../shared/components/molecules/logo/logo.component';
import { LoginFormComponent } from '../../../shared/components/organisms/login-form/login-form.component';
import { LoginRequest } from '../../../core/models/user.model';

@Component({
    selector: 'app-login',
    imports: [LogoComponent, LoginFormComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    // Get reference to the login form component
    private readonly loginFormComponent = viewChild(LoginFormComponent);

    /**
     * Handle form submission
     */
    protected onLoginSubmit(credentials: LoginRequest): void {
        const formComponent = this.loginFormComponent();
        if (!formComponent) return;

        formComponent.setLoading(true);
        formComponent.setError(null);

        this.authService.login(credentials).subscribe({
            next: (res) => {
                formComponent.setLoading(false);
                const user = res.data.user;

                // Redirección inteligente: Si ya tiene detalles o es admin, directo al dashboard
                if (user.role === 'ADMIN' || user.detalles) {
                    this.router.navigate(['/dashboard']);
                } else {
                    this.router.navigate(['/onboarding']);
                }
            },
            error: (error) => {
                formComponent.setLoading(false);
                formComponent.setError(
                    error.error?.message || 'Credenciales inválidas. Por favor, intente nuevamente.'
                );
            }
        });
    }
}

import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { UserRole } from '../../../core/models/user.model';
import { LogoComponent } from '../../../shared/components/molecules/logo/logo.component';

@Component({
    selector: 'app-onboarding',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './onboarding.component.html',
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly authService = inject(AuthService);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    protected readonly currentStep = signal(1);
    protected readonly isLoading = signal(false);
    protected onboardingForm!: FormGroup;

    ngOnInit(): void {
        const user = this.authService.currentUser();

        // Redirect if admin or already has detalles
        if (user?.role === UserRole.ADMIN || user?.detalles) {
            this.router.navigate(['/dashboard']);
            return;
        }

        this.onboardingForm = this.fb.group({
            nombre: ['', [Validators.required]],
            apellido: ['', [Validators.required]],
            cedula: ['', [Validators.required]],
            telefono: ['', [Validators.required]],
            direccionPrincipal: ['', [Validators.required]],
            direccionSecundaria: ['']
        });
    }

    protected isStepValid(): boolean {
        if (this.currentStep() === 1) {
            return this.onboardingForm.get('nombre')!.valid &&
                this.onboardingForm.get('apellido')!.valid &&
                this.onboardingForm.get('cedula')!.valid &&
                this.onboardingForm.get('telefono')!.valid;
        }
        if (this.currentStep() === 2) {
            return this.onboardingForm.get('direccionPrincipal')!.valid;
        }
        return true;
    }

    protected next(): void {
        if (this.currentStep() < 3) this.currentStep.update(s => s + 1);
    }

    protected prev(): void {
        if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
    }

    protected onLogout(): void {
        this.authService.logout();
    }

    protected onSubmit(): void {
        const user = this.authService.currentUser();
        if (!user) return;

        this.isLoading.set(true);
        const rawData = this.onboardingForm.value;

        // Sanitización estricta para endpoint /profile (Mapeo a UserDetails parcial)
        const payload = {
            nombre: rawData.nombre,
            apellido: rawData.apellido,
            cedula: rawData.cedula,
            telefono: rawData.telefono,
            direccionPrincipal: rawData.direccionPrincipal,
            direccionSecundaria: rawData.direccionSecundaria || undefined
        };

        this.userService.updateProfile(payload as any).subscribe({
            next: (res) => {
                if (res.success) {
                    const updatedUser = { ...user, detalles: res.data.detalles };
                    localStorage.setItem('user_data', JSON.stringify(updatedUser));
                    window.location.href = '/dashboard';
                }
            },
            error: () => this.isLoading.set(false)
        });
    }
}

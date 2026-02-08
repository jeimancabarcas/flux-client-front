import { Component, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldComponent } from '../../molecules/form-field/form-field.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AlertComponent } from '../../atoms/alert/alert.component';
import { LoginRequest } from '../../../../core/models/user.model';

@Component({
    selector: 'app-login-form',
    imports: [ReactiveFormsModule, FormFieldComponent, ButtonComponent, AlertComponent],
    template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
      <!-- Error Message -->
      @if (errorMessage()) {
        <app-alert variant="error">
          {{ errorMessage() }}
        </app-alert>
      }

      <!-- Email Field -->
      <app-form-field
        id="email"
        label="Correo Electrónico"
        type="email"
        [value]="loginForm.get('email')?.value || ''"
        placeholder="correo@ejemplo.com"
        [required]="true"
        [hasError]="hasError('email')"
        [errorMessage]="getErrorMessage('email')"
        autocomplete="email"
        (valueChange)="loginForm.get('email')?.setValue($event)"
        (blurred)="loginForm.get('email')?.markAsTouched()"
      />

      <!-- Password Field -->
      <app-form-field
        id="password"
        label="Contraseña"
        type="password"
        [value]="loginForm.get('password')?.value || ''"
        placeholder="••••••••"
        [required]="true"
        [hasError]="hasError('password')"
        [errorMessage]="getErrorMessage('password')"
        autocomplete="current-password"
        (valueChange)="loginForm.get('password')?.setValue($event)"
        (blurred)="loginForm.get('password')?.markAsTouched()"
      />

      <!-- Submit Button -->
      <app-button
        type="submit"
        variant="primary"
        size="md"
        [fullWidth]="true"
        [loading]="isLoading()"
        [disabled]="loginForm.invalid"
      >
        @if (isLoading()) {
          <span>Iniciando sesión...</span>
        } @else {
          <span>Iniciar Sesión</span>
        }
      </app-button>
    </form>

    <!-- Footer Links -->
    <div class="mt-6 text-center">
      <a href="#" class="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
        ¿Olvidaste tu contraseña?
      </a>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent {
    private readonly fb = inject(FormBuilder);

    protected readonly isLoading = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    submitForm = output<LoginRequest>();

    protected readonly loginForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    protected onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const credentials = this.loginForm.getRawValue();
        this.submitForm.emit(credentials);
    }

    protected hasError(fieldName: string): boolean {
        const field = this.loginForm.get(fieldName);
        return !!(field?.invalid && field?.touched);
    }

    protected getErrorMessage(fieldName: string): string {
        const field = this.loginForm.get(fieldName);

        if (field?.hasError('required')) {
            return 'Este campo es obligatorio';
        }

        if (field?.hasError('email')) {
            return 'Ingrese un correo electrónico válido';
        }

        if (field?.hasError('minlength')) {
            return 'La contraseña debe tener al menos 6 caracteres';
        }

        return '';
    }

    // Public methods to control from parent
    setLoading(loading: boolean): void {
        this.isLoading.set(loading);
    }

    setError(error: string | null): void {
        this.errorMessage.set(error);
    }
}

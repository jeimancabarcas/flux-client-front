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
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
      <!-- Error Message -->
      @if (errorMessage()) {
        <app-alert variant="error">
          {{ errorMessage() }}
        </app-alert>
      }

      <div class="space-y-6">
        <!-- Structural Input: ID -->
        <app-form-field
          id="email"
          label="ACCESS ID / NODE"
          type="email"
          [value]="loginForm.get('email')?.value || ''"
          placeholder="SYS.ADMIN@FLUX.MED"
          [required]="true"
          [hasError]="hasError('email')"
          [errorMessage]="getErrorMessage('email')"
          autocomplete="email"
          (valueChange)="loginForm.get('email')?.setValue($event)"
          (blurred)="loginForm.get('email')?.markAsTouched()"
        />

        <!-- Structural Input: KEY -->
        <app-form-field
          id="password"
          label="SECURE KEY / PASS"
          type="password"
          [value]="loginForm.get('password')?.value || ''"
          placeholder="0000-0000-0000"
          [required]="true"
          [hasError]="hasError('password')"
          [errorMessage]="getErrorMessage('password')"
          autocomplete="current-password"
          (valueChange)="loginForm.get('password')?.setValue($event)"
          (blurred)="loginForm.get('password')?.markAsTouched()"
        />
      </div>

      <!-- Swiss Functional Links -->
      <div class="flex flex-col gap-2 py-4">
        <label class="flex items-center gap-4 cursor-pointer group">
          <input 
            type="checkbox" 
            class="w-4 h-4 rounded-none border-slate-300 text-slate-900 focus:ring-0 transition-all cursor-pointer"
          />
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors select-none">
            Persistence / Save
          </span>
        </label>
        
        <a 
          href="#" 
          class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-all"
        >
          Recover / Reset
        </a>
      </div>

      <!-- Functional Execution -->
      <div class="pt-4">
        <app-button
          type="submit"
          variant="primary"
          size="md"
          [fullWidth]="true"
          [loading]="isLoading()"
          [disabled]="loginForm.invalid"
        >
          @if (isLoading()) {
            <span class="text-[10px]">EXECUTING...</span>
          } @else {
            <span class="text-[10px]">INITIALIZE SESSION</span>
          }
        </app-button>
      </div>
    </form>
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

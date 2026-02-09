import { Component, inject, signal, input, output, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserRole } from '../../../../core/models/user.model';
import { SpecialtyService } from '../../../../core/services/specialty.service';
import { Specialty } from '../../../../core/models/specialty.model';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly specialtyService = inject(SpecialtyService);

  initialData = input<User | null>(null);
  isLoading = input<boolean>(false);

  submitForm = output<any>();
  cancel = output<void>();

  protected readonly UserRole = UserRole;
  protected readonly specialties = signal<Specialty[]>([]);
  protected userForm!: FormGroup;

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (!this.userForm) return;

      if (data) {
        this.userForm.patchValue({
          email: data.email,
          role: data.role,
          nombre: data.detalles?.nombre || '',
          apellido: data.detalles?.apellido || '',
          cedula: data.detalles?.cedula || '',
          telefono: data.detalles?.telefono || '',
          direccionPrincipal: data.detalles?.direccionPrincipal || '',
          direccionSecundaria: data.detalles?.direccionSecundaria || '',
          specialtyIds: data.specialties?.map(s => s.id) || []
        });

        if (data.detalles?.cedula) {
          this.userForm.get('cedula')?.disable();
        } else {
          this.userForm.get('cedula')?.enable();
        }

        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
      } else {
        this.userForm.reset({
          role: UserRole.MEDICO,
          direccionSecundaria: '',
          specialtyIds: []
        });
        this.userForm.get('cedula')?.enable();
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
        this.userForm.get('password')?.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    this.loadSpecialties();
    const data = this.initialData();
    const isEdit = !!data;
    const hasCedula = !!data?.detalles?.cedula;

    this.userForm = this.fb.group({
      email: [data?.email || '', [Validators.required, Validators.email]],
      role: [data?.role || UserRole.MEDICO, Validators.required],
      password: ['', isEdit ? [] : [Validators.required, Validators.minLength(8)]],
      nombre: [data?.detalles?.nombre || ''],
      apellido: [data?.detalles?.apellido || ''],
      cedula: [{ value: data?.detalles?.cedula || '', disabled: isEdit && hasCedula }],
      telefono: [data?.detalles?.telefono || ''],
      direccionPrincipal: [data?.detalles?.direccionPrincipal || ''],
      direccionSecundaria: [data?.detalles?.direccionSecundaria || ''],
      specialtyIds: [data?.specialties?.map(s => s.id) || []]
    });
  }

  private loadSpecialties(): void {
    this.specialtyService.getSpecialties().subscribe({
      next: (res) => {
        if (res.success) this.specialties.set(res.data);
      }
    });
  }

  protected isSpecialtySelected(id: string): boolean {
    const selected = this.userForm.get('specialtyIds')?.value as string[];
    return selected?.includes(id) || false;
  }

  protected toggleSpecialty(id: string): void {
    const control = this.userForm.get('specialtyIds');
    const selected = [...(control?.value || [])] as string[];
    const index = selected.indexOf(id);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(id);
    }

    control?.setValue(selected);
    control?.markAsDirty();
  }

  protected isEditMode(): boolean {
    return !!this.initialData();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const rawValues = this.userForm.getRawValue();
      const payload: any = {};

      Object.keys(rawValues).forEach(key => {
        const value = rawValues[key];

        if (key === 'specialtyIds') {
          if (rawValues.role === UserRole.MEDICO) {
            payload[key] = (value && value.length > 0) ? value : [];
          }
          return;
        }

        if (value === '' || value === null) {
          payload[key] = undefined;
        } else {
          payload[key] = value;
        }
      });

      if (this.isEditMode()) {
        delete payload.password;
      }

      this.submitForm.emit(payload);
    }
  }
}

import { Component, inject, signal, input, output, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserRole } from '../../../../core/models/user.model';
import { SpecialtyService } from '../../../../core/services/specialty.service';
import { Specialty } from '../../../../core/models/specialty.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-8">
      <div class="space-y-8">
        
        <!-- Sección: Credenciales de Acceso (OBLIGATORIAS) -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600">01 / Credenciales <span class="text-red-500">*</span></span>
            <div class="h-[1px] flex-1 bg-slate-100"></div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Email de Acceso</label>
              <input 
                type="email" 
                formControlName="email"
                class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
                placeholder="USUARIO@FLUXMEDICAL.COM"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Facultad / Rol</label>
              <select 
                formControlName="role"
                class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all appearance-none bg-white font-bold"
              >
                <option [value]="UserRole.MEDICO">Medico</option>
                <option [value]="UserRole.RECEPCIONISTA">Recepcionista</option>
                <option [value]="UserRole.ADMIN">Admin</option>
              </select>
            </div>

            @if (!isEditMode()) {
              <div class="space-y-2 md:col-span-2 animate-enter">
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Contraseña</label>
                <input 
                  type="password" 
                  formControlName="password"
                  class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
                  placeholder="••••••••"
                />
              </div>
            }
          </div>
        </div>

        <!-- Sección: Especialidades Médicas (SOLO PARA MÉDICOS) -->
        @if (userForm.get('role')?.value === UserRole.MEDICO) {
          <div class="space-y-4 animate-enter">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600">02 / Especialidades</span>
              <div class="h-[1px] flex-1 bg-slate-100"></div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              @for (specialty of specialties(); track specialty.id) {
                <label 
                  [class.border-black]="isSpecialtySelected(specialty.id)"
                  [class.bg-slate-50]="isSpecialtySelected(specialty.id)"
                  class="flex items-center gap-3 p-4 border border-slate-200 cursor-pointer transition-all hover:bg-slate-50 relative group"
                >
                  <input 
                    type="checkbox" 
                    [checked]="isSpecialtySelected(specialty.id)"
                    (change)="toggleSpecialty(specialty.id)"
                    class="hidden"
                  />
                  <div 
                    [class.bg-black]="isSpecialtySelected(specialty.id)"
                    class="w-3 h-3 border border-black flex items-center justify-center transition-colors"
                  >
                    @if (isSpecialtySelected(specialty.id)) {
                      <div class="w-1.5 h-1.5 bg-white"></div>
                    }
                  </div>
                  <span class="text-[10px] font-black uppercase tracking-tight truncate leading-none">
                    {{ specialty.name }}
                  </span>
                </label>
              } @empty {
                <p class="text-[10px] font-bold text-slate-300 uppercase tracking-widest col-span-full py-4 text-center border-[1px] border-dashed border-slate-200">
                  No se detectaron especialidades en el sistema.
                </p>
              }
            </div>
          </div>
        }

        <!-- Sección: Identidad y Datos Personales (OPCIONALES) -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">03 / Identidad (Opcional)</span>
            <div class="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</label>
              <input type="text" formControlName="nombre" class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all" />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Apellido</label>
              <input type="text" formControlName="apellido" class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all" />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Cédula / ID</label>
              <input 
                type="text" 
                formControlName="cedula" 
                class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed" 
              />
              @if (isEditMode() && userForm.get('cedula')?.disabled) {
                <p class="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Identificador inmutable del nodo.</p>
              }
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</label>
              <input type="text" formControlName="telefono" class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all" />
            </div>
          </div>
        </div>

        <!-- Sección: Ubicación y Sede (OPCIONALES) -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">04 / Ubicación (Opcional)</span>
            <div class="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          <div class="space-y-6">
            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección Principal</label>
              <input type="text" formControlName="direccionPrincipal" class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all" />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección Secundaria</label>
              <input type="text" formControlName="direccionSecundaria" class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all" />
            </div>
          </div>
        </div>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
        <button 
          type="submit" 
          [disabled]="userForm.invalid || isLoading()"
          class="flex-1 bg-black text-white p-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-600 disabled:opacity-20 transition-all font-['Inter']"
        >
          @if (isLoading()) { PROCESANDO... } @else { {{ isEditMode() ? 'GUARDAR CAMBIOS' : 'CONFIRMAR REGISTRO' }} }
        </button>
        <button 
          type="button" 
          (click)="cancel.emit()"
          class="px-8 border border-black p-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 transition-all font-['Inter']"
        >
          CANCELAR
        </button>
      </div>
    </form>
  `,
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
          nombre: data.details?.nombre || '',
          apellido: data.details?.apellido || '',
          cedula: data.details?.cedula || '',
          telefono: data.details?.telefono || '',
          direccionPrincipal: data.details?.direccionPrincipal || '',
          direccionSecundaria: data.details?.direccionSecundaria || '',
          specialtyIds: data.specialties?.map(s => s.id) || []
        });

        if (data.details?.cedula) {
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
    const hasCedula = !!data?.details?.cedula;

    this.userForm = this.fb.group({
      email: [data?.email || '', [Validators.required, Validators.email]],
      role: [data?.role || UserRole.MEDICO, Validators.required],
      password: ['', isEdit ? [] : [Validators.required, Validators.minLength(8)]],
      nombre: [data?.details?.nombre || ''],
      apellido: [data?.details?.apellido || ''],
      cedula: [{ value: data?.details?.cedula || '', disabled: isEdit && hasCedula }],
      telefono: [data?.details?.telefono || ''],
      direccionPrincipal: [data?.details?.direccionPrincipal || ''],
      direccionSecundaria: [data?.details?.direccionSecundaria || ''],
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
          // Solo incluimos specialtyIds en el payload si el rol es MEDICO
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

import { Component, inject, signal, input, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Specialty } from '../../../../core/models/specialty.model';

@Component({
  selector: 'app-specialty-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="specialtyForm" (ngSubmit)="onSubmit()" class="space-y-6">
      <div class="space-y-6">
        <!-- Nombre -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Denominación / Nombre</label>
          <input 
            type="text" 
            formControlName="name"
            class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
            placeholder="EJ: CARDIOLOGÍA, NEUROLÓGIA"
          />
        </div>

        <!-- Descripcion -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción / Detalles</label>
          <textarea 
            formControlName="description"
            rows="4"
            class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all resize-none"
            placeholder="DETALLES TÉCNICOS DE LA ESPECIALIDAD..."
          ></textarea>
        </div>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row gap-4">
        <button 
          type="submit" 
          [disabled]="specialtyForm.invalid || isLoading()"
          class="flex-1 bg-black text-white p-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-600 disabled:opacity-20 transition-all font-['Inter']"
        >
          @if (isLoading()) { PROCESANDO DENOMINACIÓN... } @else { CONFIRMAR REGISTRO }
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
export class SpecialtyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  initialData = input<Specialty | null>(null);
  isLoading = input<boolean>(false);

  submitForm = output<any>();
  cancel = output<void>();

  protected specialtyForm!: FormGroup;

  ngOnInit(): void {
    const data = this.initialData();
    this.specialtyForm = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      description: [data?.description || '', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.specialtyForm.valid) {
      this.submitForm.emit(this.userPayload());
    }
  }

  private userPayload() {
    const rawValue = this.specialtyForm.value;
    return {
      name: rawValue.name,
      description: rawValue.description
    };
  }
}

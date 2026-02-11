import { Component, inject, signal, input, output, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Agreement, CatalogItem, Prepagada } from '../../../../core/models/masters.model';
import { SearchableSelectComponent, SearchableOption } from '../../atoms/searchable-select/searchable-select.component';

@Component({
  selector: 'app-agreement-form',
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  template: `
    <form [formGroup]="agreementForm" (ngSubmit)="onSubmit()" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Servicio / Producto -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Servicio o Producto</label>
          <app-searchable-select
            formControlName="productServiceId"
            [options]="catalogOptions()"
            [placeholder]="'Seleccionar servicio...'"
            [emptyMessage]="'No se encontraron servicios'"
          ></app-searchable-select>
        </div>

        <!-- Prepagada -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Entidad Prepagada</label>
          <app-searchable-select
            formControlName="prepagadaId"
            [options]="prepagadaOptions()"
            [placeholder]="'Seleccionar entidad...'"
            [emptyMessage]="'No se encontraron entidades'"
          ></app-searchable-select>
        </div>

        <!-- Monto Paciente -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Monto Paciente (Copago)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
            <input 
              type="number" 
              formControlName="patientAmount"
              class="w-full border border-slate-200 p-4 pl-8 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <!-- Monto Entidad -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Monto Entidad (Aseguradora)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
            <input 
              type="number" 
              formControlName="entityAmount"
              class="w-full border border-slate-200 p-4 pl-8 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <!-- Estado Activo -->
      <div class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100">
        <input 
          type="checkbox" 
          id="isActive"
          formControlName="isActive"
          class="w-4 h-4 accent-black"
        />
        <label for="isActive" class="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer">
          Convenio Activo para Facturación
        </label>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row gap-4">
        <button 
          type="submit" 
          [disabled]="agreementForm.invalid || isLoading()"
          class="flex-1 bg-black text-white p-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-600 disabled:opacity-20 transition-all font-['Inter']"
        >
          @if (isLoading()) { PROCESANDO CONVENIO... } @else { CONFIRMAR REGISTRO }
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
export class AgreementFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  initialData = input<Agreement | null>(null);
  catalogItems = input<CatalogItem[]>([]);
  prepagadas = input<Prepagada[]>([]);
  isLoading = input<boolean>(false);

  submitForm = output<any>();
  cancel = output<void>();

  protected agreementForm!: FormGroup;

  protected readonly catalogOptions = computed(() =>
    this.catalogItems().map(item => ({
      value: item.id,
      label: item.name,
      sublabel: `${item.code} - ${item.type === 'SERVICE' ? 'SERVICIO' : 'PRODUCTO'}`
    }))
  );

  protected readonly prepagadaOptions = computed(() =>
    this.prepagadas().map(item => ({
      value: item.id,
      label: item.name
    }))
  );

  ngOnInit(): void {
    const data = this.initialData();

    // Normalizar IDs por si vienen anidados en el objeto de la relación
    const productServiceId = data?.productServiceId || data?.productService?.id || '';
    const prepagadaId = data?.prepagadaId || data?.prepagada?.id || '';

    this.agreementForm = this.fb.group({
      productServiceId: [productServiceId, [Validators.required]],
      prepagadaId: [prepagadaId, [Validators.required]],
      patientAmount: [data?.patientAmount ?? 0, [Validators.required, Validators.min(0)]],
      entityAmount: [data?.entityAmount ?? 0, [Validators.required, Validators.min(0)]],
      isActive: [data?.isActive ?? true]
    });
  }

  onSubmit(): void {
    if (this.agreementForm.valid) {
      this.submitForm.emit(this.agreementForm.value);
    }
  }
}

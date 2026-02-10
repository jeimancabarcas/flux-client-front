import { Component, inject, input, output, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogItem } from '../../../../core/models/masters.model';

@Component({
    selector: 'app-catalog-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <form [formGroup]="catalogForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Tipo -->
                <div class="space-y-2">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Item</label>
                    <select formControlName="type"
                        class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all appearance-none bg-white">
                        <option value="SERVICE">SERVICIO (CUPS)</option>
                        <option value="PRODUCT">PRODUCTO (CUMS)</option>
                    </select>
                </div>

                <!-- Código -->
                <div class="space-y-2">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Código (CUPS/CUMS)</label>
                    <input type="text" formControlName="code"
                        class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
                        placeholder="Ej: 890201..." />
                </div>
            </div>

            <!-- Nombre -->
            <div class="space-y-2">
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Descriptivo</label>
                <input type="text" formControlName="name"
                    class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
                    placeholder="Escriba el nombre comercial o técnico..." />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Precio -->
                <div class="space-y-2">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Precio Unitario ($)</label>
                    <input type="number" formControlName="price"
                        class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
                        placeholder="0.00" />
                </div>

                <!-- Stock (Solo para Productos) -->
                @if (catalogForm.get('type')?.value === 'PRODUCT') {
                <div class="space-y-2 animate-enter">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Disponible</label>
                    <input type="number" formControlName="stock"
                        class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
                        placeholder="Cantidad en inventario..." />
                </div>
                }
            </div>

            <!-- Estado -->
            <div class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100">
                <input type="checkbox" formControlName="isActive" id="isActive"
                    class="w-4 h-4 border-black text-black focus:ring-0 cursor-pointer" />
                <label for="isActive" class="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer select-none">
                    Item Habilitado para Facturación
                </label>
            </div>

            <div class="pt-6 flex gap-3">
                <button type="submit" [disabled]="catalogForm.invalid || isProcessing()"
                    class="flex-1 bg-black text-white p-4 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 disabled:opacity-20 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                    {{ isProcessing() ? 'PROCESANDO...' : (initialData() ? 'ACTUALIZAR ÍTEM' : 'VINCULAR AL CATÁLOGO') }}
                </button>
            </div>
        </form>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogFormComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);

    readonly initialData = input<CatalogItem | null>(null);
    readonly isProcessing = input<boolean>(false);
    readonly submitted = output<Partial<CatalogItem>>();

    protected catalogForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialData'] && this.catalogForm) {
            this.initForm();
        }
    }

    private initForm(): void {
        this.catalogForm = this.fb.group({
            code: [this.initialData()?.code || '', [Validators.required]],
            name: [this.initialData()?.name || '', [Validators.required]],
            type: [this.initialData()?.type || 'SERVICE', [Validators.required]],
            price: [this.initialData()?.price || 0, [Validators.required, Validators.min(0)]],
            isActive: [this.initialData()?.isActive ?? true],
            stock: [this.initialData()?.stock ?? 0]
        });
    }

    protected onSubmit(): void {
        if (this.catalogForm.valid) {
            const val = this.catalogForm.value;
            // Si es servicio, el stock debe ser null
            if (val.type === 'SERVICE') val.stock = null;
            this.submitted.emit(val);
        }
    }
}

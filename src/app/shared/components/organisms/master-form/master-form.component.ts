import { Component, inject, input, output, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterItem } from '../../../../core/models/masters.model';

@Component({
    selector: 'app-master-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <form [formGroup]="masterForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-2">
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Maestro</label>
                <input type="text" formControlName="name"
                    class="w-full border border-slate-200 p-4 text-xs font-bold uppercase tracking-tight focus:border-black outline-none transition-all placeholder:text-slate-200"
                    placeholder="Escriba el nombre aquí..." />
                @if (masterForm.get('name')?.touched && masterForm.get('name')?.invalid) {
                    <p class="text-[9px] font-bold text-red-500 uppercase tracking-widest">El nombre es requerido</p>
                }
            </div>

            <div class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100">
                <input type="checkbox" formControlName="isActive" id="isActive"
                    class="w-4 h-4 border-black text-black focus:ring-0 cursor-pointer" />
                <label for="isActive" class="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer select-none">
                    Estado Activo
                </label>
            </div>

            <div class="pt-6 flex gap-3">
                <button type="submit" [disabled]="masterForm.invalid || isProcessing()"
                    class="flex-1 bg-black text-white p-4 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 disabled:opacity-20 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                    {{ isProcessing() ? 'PROCESANDO...' : (initialData() ? 'ACTUALIZAR REGISTRO' : 'CREAR REGISTRO') }}
                </button>
            </div>
        </form>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasterFormComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);

    readonly initialData = input<MasterItem | null>(null);
    readonly isProcessing = input<boolean>(false);
    readonly submitted = output<Partial<MasterItem>>();

    protected masterForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialData'] && this.masterForm) {
            this.initForm();
        }
    }

    private initForm(): void {
        this.masterForm = this.fb.group({
            name: [this.initialData()?.name || '', [Validators.required]],
            isActive: [this.initialData()?.isActive ?? true]
        });
    }

    protected onSubmit(): void {
        if (this.masterForm.valid) {
            this.submitted.emit(this.masterForm.value);
        }
    }
}

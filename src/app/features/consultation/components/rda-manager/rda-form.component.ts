import { Component, OnInit, signal, inject, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ClinicalRecordRDA, RdaType } from '../../../../core/models/rda.model';
import { CardComponent } from '../../../../shared/components/atoms/card/card.component';
import { SearchableSelectComponent, SearchableOption } from '../../../../shared/components/atoms/searchable-select/searchable-select.component';
import { CatalogItem } from '../../../../core/models/masters.model';
import { MastersService } from '../../../../core/services/masters.service';

@Component({
    selector: 'app-rda-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CardComponent, SearchableSelectComponent],
    template: `
    <div class="space-y-12 pb-20">
        <form [formGroup]="rdaForm" class="space-y-12">
            
            <!-- Section 1: Clinical Narrative -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center gap-4">
                    <span class="text-xl font-black text-white bg-black px-3 py-1">01</span>
                    <h4 class="text-xl font-black uppercase tracking-tighter">Narrativa Clínica</h4>
                </div>
                
                <div class="grid grid-cols-1 gap-8">
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo de Consulta</label>
                        <textarea formControlName="reasonForConsultation" rows="3" 
                            class="p-4 border-2 border-black focus:border-cyan-500 outline-none transition-all resize-none font-medium text-sm"
                            placeholder="Describa el motivo principal..."></textarea>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Enfermedad Actual</label>
                        <textarea formControlName="currentIllness" rows="5" 
                            class="p-4 border-2 border-black focus:border-cyan-500 outline-none transition-all resize-none font-medium text-sm"
                            placeholder="Cronología y detalles de la sintomatología..."></textarea>
                    </div>
                </div>
            </app-card>

            <!-- Section 2: Physical Exam & Vitals -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center gap-4">
                    <span class="text-xl font-black text-white bg-black px-3 py-1">02</span>
                    <h4 class="text-xl font-black uppercase tracking-tighter">Examen Físico y Signos Vitales</h4>
                </div>
                
                <div formGroupName="vitalSigns" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Tensión Art. (mmHg)</label>
                        <input type="text" formControlName="bloodPressure" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Frec. Cardiaca (LPM)</label>
                        <input type="number" formControlName="heartRate" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Frec. Resp. (RPM)</label>
                        <input type="number" formControlName="respiratoryRate" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Temperatura (°C)</label>
                        <input type="number" step="0.1" formControlName="temperature" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Peso (kg)</label>
                        <input type="number" step="0.1" formControlName="weight" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Talla (cm)</label>
                        <input type="number" formControlName="height" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center">
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Hallazgos Examen Físico</label>
                    <textarea formControlName="physicalExamination" rows="4" 
                        class="p-4 border-2 border-black focus:border-cyan-500 outline-none transition-all resize-none font-medium text-sm"
                        placeholder="Descripción detallada por sistemas..."></textarea>
                </div>
            </app-card>

            <!-- Section 3: Diagnoses -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <span class="text-xl font-black text-white bg-black px-3 py-1">03</span>
                        <h4 class="text-xl font-black uppercase tracking-tighter">Diagnósticos (CIE-10)</h4>
                    </div>
                    <button type="button" (click)="addDiagnosis()" class="text-[10px] font-black uppercase border-b-2 border-black hover:text-cyan-600 transition-all">+ Agregar Diagnóstico</button>
                </div>
                
                <div formArrayName="diagnoses" class="space-y-4">
                    @for (diag of diagnoses.controls; track diag; let i = $index) {
                        <div [formGroupName]="i" class="flex gap-4 items-end animate-enter">
                            <div class="w-24">
                                <label class="text-[9px] font-black uppercase text-slate-400 block mb-1">Código</label>
                                <input type="text" formControlName="code" class="w-full p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold uppercase">
                            </div>
                            <div class="flex-1">
                                <label class="text-[9px] font-black uppercase text-slate-400 block mb-1">Descripción</label>
                                <input type="text" formControlName="description" class="w-full p-3 border-2 border-black focus:border-cyan-500 outline-none font-medium">
                            </div>
                            <div class="w-40">
                                <label class="text-[9px] font-black uppercase text-slate-400 block mb-1">Tipo</label>
                                <select formControlName="type" class="w-full p-3 border-2 border-black focus:border-cyan-500 outline-none font-black uppercase text-[10px]">
                                    <option value="PRINCIPAL">PRINCIPAL</option>
                                    <option value="RELACIONADO">RELACIONADO</option>
                                    <option value="COMPLICACION">COMPLICACION</option>
                                </select>
                            </div>
                            <button type="button" (click)="removeDiagnosis(i)" class="p-3 text-red-500 hover:bg-black hover:text-white transition-all border-2 border-transparent hover:border-black">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    }
                </div>
            </app-card>

            <!-- Section 4: Treatment & Conclusions -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center gap-4">
                    <span class="text-xl font-black text-white bg-black px-3 py-1">04</span>
                    <h4 class="text-xl font-black uppercase tracking-tighter">Plan, Manejo y Conducta</h4>
                </div>
                
                <div class="grid grid-cols-1 gap-8">
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Curativo y Tratamiento</label>
                        <textarea formControlName="planAndTreatment" rows="4" 
                            class="p-4 border-2 border-black focus:border-cyan-500 outline-none transition-all resize-none font-medium text-sm"
                            placeholder="Describa el plan farmacológico y no farmacológico..."></textarea>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Recomendaciones e Instrucciones</label>
                        <textarea formControlName="recommendations" rows="3" 
                            class="p-4 border-2 border-black focus:border-cyan-500 outline-none transition-all resize-none font-medium text-sm"
                            placeholder="Indicaciones para el paciente..."></textarea>
                    </div>
                </div>
            </app-card>

            <!-- Section 5: Procedures & Charges (CUPS/CUMS) -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <span class="text-xl font-black text-white bg-black px-3 py-1">05</span>
                        <h4 class="text-xl font-black uppercase tracking-tighter">Procedimientos y Cargos (CUPS/CUMS)</h4>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-300">Vincular nuevos servicios o productos</label>
                        <app-searchable-select 
                            [options]="catalogOptions()" 
                            [placeholder]="'BUSCAR EN EL CATÁLOGO INSTITUCIONAL...'"
                            (selectionChange)="onSelectProcedure($any($event))"
                            (searchChange)="searchCatalog($event)"
                            [loading]="searchingCatalog()"
                            [emptyMessage]="'NO SE ENCONTRARON COINCIDENCIAS'">
                        </app-searchable-select>
                    </div>

                    <!-- Selected Procedures List -->
                    <div class="space-y-4">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedimientos a Facturar ({{ procedures.length }})</label>
                        <div class="flex flex-col gap-2">
                            @for (proc of procedures.controls; track proc; let i = $index) {
                                <div [formGroupName]="i" class="flex items-center justify-between p-4 bg-slate-50 border-2 border-black group/item animate-enter">
                                    <div class="flex flex-col gap-1">
                                        <div class="flex items-center gap-2">
                                            <span class="text-[9px] font-black px-1.5 py-0.5 bg-black text-white italic tracking-widest">{{ proc.get('code')?.value }}</span>
                                            <span class="text-sm font-black text-black uppercase">{{ proc.get('description')?.value }}</span>
                                        </div>
                                    </div>
                                    <button type="button" (click)="removeProcedure(i)" class="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            }
                            @if (procedures.length === 0) {
                                <div class="p-8 text-center border-2 border-dashed border-slate-200">
                                    <p class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No hay procedimientos vinculados a esta atención</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </app-card>

            <div class="pt-10 flex justify-end">
                <button type="submit" 
                    [disabled]="rdaForm.invalid"
                    (click)="onSubmit()"
                    class="px-12 py-4 bg-black text-white text-sm font-black uppercase tracking-[0.2em] hover:bg-cyan-600 transition-all shadow-[8px_8px_0px_rgba(0,173,181,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                    Guardar Registro Digital (RDA)
                </button>
            </div>
        </form>
    </div>
    `,
    styles: [`
        .animate-enter {
            animation: enter 0.3s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @keyframes enter {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RdaFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);

    patientId = input.required<string>();
    appointmentId = input.required<string>();
    doctorId = input.required<string>();
    initialItemIds = input<string[]>([]); // Items pre-cargados por recepción

    save = output<ClinicalRecordRDA>();

    protected rdaForm!: FormGroup;

    private readonly mastersService = inject(MastersService);
    protected readonly catalogItems = signal<CatalogItem[]>([]);
    protected readonly searchingCatalog = signal(false);

    protected readonly catalogOptions = computed<SearchableOption[]>(() =>
        this.catalogItems()
            .filter(i => i.isActive)
            .map(i => ({
                value: i.id,
                label: i.name,
                sublabel: `${i.code} | $${i.price.toLocaleString()}`
            }))
    );

    ngOnInit(): void {
        this.initForm();
        this.loadInitialCatalog();
    }

    private loadInitialCatalog(): void {
        this.mastersService.getCatalog().subscribe({
            next: (res) => {
                if (res.success) {
                    this.catalogItems.set(res.data);
                    // Pre-cargar los items iniciales si existen
                    const preloadedIds = this.initialItemIds();
                    if (preloadedIds && preloadedIds.length > 0) {
                        res.data
                            .filter(item => preloadedIds.includes(item.id))
                            .forEach(item => this.addProcedureFromCatalog(item));
                    }
                }
            }
        });
    }

    protected searchCatalog(term: string): void {
        if (!term || term.length < 2) return;
        this.searchingCatalog.set(true);
        this.mastersService.searchCatalog(term).subscribe({
            next: (res) => {
                if (res.success) {
                    const current = this.catalogItems();
                    const next = [...current, ...res.data.filter(ni => !current.find(ci => ci.id === ni.id))];
                    this.catalogItems.set(next);
                }
                this.searchingCatalog.set(false);
            },
            error: () => this.searchingCatalog.set(false)
        });
    }

    private initForm(): void {
        this.rdaForm = this.fb.group({
            type: [RdaType.CONSULTA_EXTERNA],
            reasonForConsultation: ['', Validators.required],
            currentIllness: ['', Validators.required],
            physicalExamination: ['', Validators.required],
            vitalSigns: this.fb.group({
                bloodPressure: [''],
                heartRate: [null],
                respiratoryRate: [null],
                temperature: [null],
                weight: [null],
                height: [null]
            }),
            diagnoses: this.fb.array([]),
            procedures: this.fb.array([]),
            medications: this.fb.array([]),
            planAndTreatment: ['', Validators.required],
            recommendations: ['', Validators.required]
        });

        // Add initial principal diagnosis
        this.addDiagnosis();
    }

    get diagnoses() {
        return this.rdaForm.get('diagnoses') as FormArray;
    }

    get procedures() {
        return this.rdaForm.get('procedures') as FormArray;
    }

    onSelectProcedure(id: string): void {
        const item = this.catalogItems().find(i => i.id === id);
        if (item) {
            this.addProcedureFromCatalog(item);
        }
    }

    private addProcedureFromCatalog(item: CatalogItem): void {
        // Evitar duplicados
        const exists = this.procedures.value.some((p: any) => p.code === item.code);
        if (exists) return;

        const procGroup = this.fb.group({
            code: [item.code, Validators.required],
            description: [item.name, Validators.required]
        });
        this.procedures.push(procGroup);
    }

    removeProcedure(index: number): void {
        this.procedures.removeAt(index);
    }

    addDiagnosis(): void {
        const diagGroup = this.fb.group({
            code: ['', [Validators.required, Validators.pattern(/^[A-Z][0-9][0-9].*$/)]],
            description: ['', Validators.required],
            type: ['PRINCIPAL', Validators.required]
        });
        this.diagnoses.push(diagGroup);
    }

    removeDiagnosis(index: number): void {
        if (this.diagnoses.length > 1) {
            this.diagnoses.removeAt(index);
        }
    }

    onSubmit(): void {
        if (this.rdaForm.valid) {
            const rdaData: ClinicalRecordRDA = {
                ...this.rdaForm.value,
                patientId: this.patientId(),
                appointmentId: this.appointmentId(),
                doctorId: this.doctorId()
            };
            this.save.emit(rdaData);
        }
    }
}

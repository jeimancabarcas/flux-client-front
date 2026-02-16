import { Component, OnInit, signal, inject, Input, output, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import {
    ClinicalRecordRDA,
    RdaType
} from '../../../../core/models/rda.model';
import {
    PatientBackground,
    PediatricExtension
} from '../../../../core/models/medical-record.model';
import { CardComponent } from '../../../../shared/components/atoms/card/card.component';
import { IcdSelectorComponent } from '../../../../shared/components/molecules/icd-selector/icd-selector.component';
import { IcdDiagnosis } from '../../../../core/models/icd.model';

@Component({
    selector: 'app-rda-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, CardComponent, IcdSelectorComponent],
    template: `
    <div class="space-y-12 pb-20 relative" [class.is-read-only]="isReadOnly">
        @if (isReadOnly) {
            <div class="watermark">FINALIZADO</div>
            <div class="sticky top-24 z-50 animate-enter">
                <div class="bg-emerald-500 text-white p-4 shadow-[8px_8px_0px_rgba(16,185,129,0.2)] flex items-center justify-between border-2 border-black">
                    <div class="flex items-center gap-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-black uppercase tracking-widest">Atención Guardada Correctamente - Modo Lectura</span>
                    </div>
                </div>
            </div>
        }

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
                            class="p-4 border-2 outline-none transition-all resize-none font-medium text-sm"
                            [class.border-black]="!rdaForm.get('reasonForConsultation')?.invalid || !rdaForm.get('reasonForConsultation')?.touched"
                            [class.border-red-500]="rdaForm.get('reasonForConsultation')?.invalid && rdaForm.get('reasonForConsultation')?.touched"
                            placeholder="Describa el motivo principal..."></textarea>
                        @if (rdaForm.get('reasonForConsultation')?.invalid && rdaForm.get('reasonForConsultation')?.touched) {
                            <span class="text-[9px] font-bold text-red-500 uppercase tracking-tight">{{ getFieldError('reasonForConsultation') }}</span>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Enfermedad Actual</label>
                        <textarea formControlName="currentIllness" rows="5" 
                            class="p-4 border-2 outline-none transition-all resize-none font-medium text-sm"
                            [class.border-black]="!rdaForm.get('currentIllness')?.invalid || !rdaForm.get('currentIllness')?.touched"
                            [class.border-red-500]="rdaForm.get('currentIllness')?.invalid && rdaForm.get('currentIllness')?.touched"
                            [class.focus:border-cyan-500]="!rdaForm.get('currentIllness')?.invalid"
                            placeholder="Cronología y detalles de la sintomatología..."></textarea>
                        @if (rdaForm.get('currentIllness')?.invalid && rdaForm.get('currentIllness')?.touched) {
                            <span class="text-[9px] font-bold text-red-500 uppercase tracking-tight">{{ getFieldError('currentIllness') }}</span>
                        }
                    </div>
                </div>
            </app-card>

            <!-- Section 2: Patient Background & Review of Systems -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center gap-4">
                    <span class="text-xl font-black text-white bg-black px-3 py-1">02</span>
                    <h4 class="text-xl font-black uppercase tracking-tighter">Antecedentes y Revisión por Sistemas</h4>
                </div>

                <div formGroupName="patientBackground" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Patológicos</label>
                        <textarea formControlName="pathological" rows="2" class="p-4 border-2 border-black outline-none transition-all resize-none font-medium text-sm" placeholder="Enfermedades previas..."></textarea>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Quirúrgicos</label>
                        <textarea formControlName="surgical" rows="2" class="p-4 border-2 border-black outline-none transition-all resize-none font-medium text-sm" placeholder="Cirugías previas..."></textarea>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-red-500">Alérgicos</label>
                        <textarea formControlName="allergic" rows="2" class="p-4 border-2 border-black focus:border-red-500 outline-none transition-all resize-none font-bold text-sm" placeholder="Medicamentos, alimentos, etc..."></textarea>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Farmacológicos</label>
                        <textarea formControlName="pharmacological" rows="2" class="p-4 border-2 border-black outline-none transition-all resize-none font-medium text-sm" placeholder="Medicamentos actuales..."></textarea>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Familiares</label>
                        <textarea formControlName="familyHistory" rows="2" class="p-4 border-2 border-black outline-none transition-all resize-none font-medium text-sm" placeholder="Antecedentes familiares relevantes..."></textarea>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-cyan-600">Revisión por Sistemas</label>
                        <textarea formControlName="reviewOfSystems" rows="2" class="p-4 border-2 border-black focus:border-cyan-600 outline-none transition-all resize-none font-medium text-sm" placeholder="Otros síntomas por sistemas..."></textarea>
                    </div>
                </div>
            </app-card>

            <!-- Section 3: Physical Exam & Vitals -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <span class="text-xl font-black text-white bg-black px-3 py-1">03</span>
                        <h4 class="text-xl font-black uppercase tracking-tighter">Examen Físico y Signos Vitales</h4>
                    </div>
                    @if (!isReadOnly) {
                        <div class="flex items-center gap-2">
                             <input type="checkbox" id="noTa" [formControl]="$any(rdaForm.get('vitalSigns.isTaNotTaken'))" class="w-4 h-4 accent-black">
                             <label for="noTa" class="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">TA No Tomada</label>
                        </div>
                    }
                </div>
                
                <div formGroupName="vitalSigns" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    <div class="flex flex-col gap-2 col-span-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Tensión Arterial (Sist/Diast)</label>
                        <div class="flex items-center gap-1">
                            <input type="number" formControlName="systolicBloodPressure" 
                                [attr.disabled]="rdaForm.get('vitalSigns.isTaNotTaken')?.value ? true : null"
                                class="w-1/2 p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center text-xs placeholder:font-medium"
                                placeholder="Sist">
                            <span class="font-black">/</span>
                            <input type="number" formControlName="diastolicBloodPressure" 
                                [attr.disabled]="rdaForm.get('vitalSigns.isTaNotTaken')?.value ? true : null"
                                class="w-1/2 p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center text-xs placeholder:font-medium"
                                placeholder="Diast">
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Frecuencia Cardíaca (FC)</label>
                        <input type="number" formControlName="heartRate" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center text-xs" placeholder="LPM">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Frecuencia Respiratoria (FR)</label>
                        <input type="number" formControlName="respiratoryRate" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center text-xs" placeholder="RPM">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Temperatura</label>
                        <input type="number" step="0.1" formControlName="temperature" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center text-xs" placeholder="°C">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Peso (kg)</label>
                        <input type="number" step="0.1" formControlName="weight" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center text-xs" placeholder="kg">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Talla (cm)</label>
                        <input type="number" formControlName="height" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold text-center text-xs" placeholder="cm">
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción de hallazgos</label>
                    <textarea formControlName="physicalExamination" rows="4" 
                        class="p-4 border-2 outline-none transition-all resize-none font-medium text-sm"
                        [class.border-black]="!rdaForm.get('physicalExamination')?.invalid || !rdaForm.get('physicalExamination')?.touched"
                        [class.border-red-500]="rdaForm.get('physicalExamination')?.invalid && rdaForm.get('physicalExamination')?.touched"
                        [class.focus:border-cyan-500]="!rdaForm.get('physicalExamination')?.invalid"
                        placeholder="Descripción detallada de los hallazgos encontrados durante el examen físico por sistemas..."></textarea>
                    @if (rdaForm.get('physicalExamination')?.invalid && rdaForm.get('physicalExamination')?.touched) {
                        <span class="text-[9px] font-bold text-red-500 uppercase tracking-tight">{{ getFieldError('physicalExamination') }}</span>
                    }
                </div>
            </app-card>

            <!-- Section 4: Diagnoses -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center gap-4">
                    <span class="text-xl font-black text-white bg-black px-3 py-1">04</span>
                    <h4 class="text-xl font-black uppercase tracking-tighter">Impresión Diagnóstica (CIE-11)</h4>
                </div>

                <div class="space-y-6">
                    <app-icd-selector 
                        [label]="'Buscador Global de Patologías'"
                        [initialSelection]="initialIcdCodes()"
                        (selectionChange)="onIcdSelectionChange($event)"
                    ></app-icd-selector>
                </div>
            </app-card>

            <!-- Section 5: Treatment & Plan -->
            <app-card customClass="p-10 space-y-8">
                <div class="flex items-center gap-4">
                    <span class="text-xl font-black text-white bg-black px-3 py-1">05</span>
                    <h4 class="text-xl font-black uppercase tracking-tighter">Plan de Manejo y Recomendaciones</h4>
                </div>

                <div class="grid grid-cols-1 gap-8">
                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Tratamiento y Plan</label>
                        <textarea formControlName="planAndTreatment" rows="4" 
                            class="p-4 border-2 outline-none transition-all resize-none font-medium text-sm"
                            [class.border-black]="!rdaForm.get('planAndTreatment')?.invalid || !rdaForm.get('planAndTreatment')?.touched"
                            [class.border-red-500]="rdaForm.get('planAndTreatment')?.invalid && rdaForm.get('planAndTreatment')?.touched"
                            [class.focus:border-cyan-500]="!rdaForm.get('planAndTreatment')?.invalid"
                            placeholder="Describa el plan terapéutico a seguir..."></textarea>
                        @if (rdaForm.get('planAndTreatment')?.invalid && rdaForm.get('planAndTreatment')?.touched) {
                            <span class="text-[9px] font-bold text-red-500 uppercase tracking-tight">{{ getFieldError('planAndTreatment') }}</span>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Recomendaciones al Paciente</label>
                        <textarea formControlName="recommendations" rows="3" 
                            class="p-4 border-2 outline-none transition-all resize-none font-medium text-sm"
                            [class.border-black]="!rdaForm.get('recommendations')?.invalid || !rdaForm.get('recommendations')?.touched"
                            [class.border-red-500]="rdaForm.get('recommendations')?.invalid && rdaForm.get('recommendations')?.touched"
                            [class.focus:border-cyan-500]="!rdaForm.get('recommendations')?.invalid"
                            placeholder="Signos de alarma, cuidados en casa..."></textarea>
                        @if (rdaForm.get('recommendations')?.invalid && rdaForm.get('recommendations')?.touched) {
                            <span class="text-[9px] font-bold text-red-500 uppercase tracking-tight">{{ getFieldError('recommendations') }}</span>
                        }
                    </div>
                </div>

                <!-- Pediatric Toggle -->
                <div class="pt-6 border-t-2 border-dashed border-slate-200">
                    <button type="button" 
                        (click)="togglePediatric()"
                        class="flex items-center gap-2 group cursor-pointer">
                        <div class="w-6 h-6 border-2 border-black flex items-center justify-center transition-all group-hover:bg-black"
                            [class.bg-black]="showPediatric()">
                            @if (showPediatric()) {
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                </svg>
                            }
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-widest" [class.text-slate-400]="!showPediatric()">Habilitar Extensión Pediátrica</span>
                    </button>
                </div>

                @if (showPediatric()) {
                    <div formGroupName="pediatricExtension" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-6 animate-enter">
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] font-black uppercase text-slate-400">Peso (kg)</label>
                            <input type="number" step="0.1" formControlName="weight" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold">
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] font-black uppercase text-slate-400">Talla (cm)</label>
                            <input type="number" step="0.1" formControlName="height" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold">
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] font-black uppercase text-slate-400">Perímetro Cefálico (cm)</label>
                            <input type="number" step="0.1" formControlName="cephalicPerimeter" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold">
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[9px] font-black uppercase text-slate-400">Perímetro Abdominal (cm)</label>
                            <input type="number" step="0.1" formControlName="abdominalPerimeter" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-bold">
                        </div>
                        <div class="flex flex-col gap-2 md:col-span-2 lg:col-span-4">
                            <label class="text-[9px] font-black uppercase text-slate-400">Antecedentes Perinatales</label>
                            <textarea formControlName="perinatalHistory" rows="2" class="p-3 border-2 border-black focus:border-cyan-500 outline-none font-medium text-sm" placeholder="Detalles del parto, semanas de gestación, etc..."></textarea>
                        </div>
                    </div>
                }
            </app-card>

            <div class="pt-10 flex flex-col items-end gap-3">
                @if (isReadOnly) {
                    <div class="flex items-center gap-3 px-8 py-4 bg-slate-100 border-2 border-black text-slate-500 font-bold uppercase text-xs">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Registro Finalizado / Inmodificable
                    </div>
                } @else {
                    @if (rdaForm.invalid) {
                        <div class="flex flex-col items-end gap-1 animate-enter">
                            <span class="text-[10px] font-bold text-red-500 uppercase">
                                * Faltan campos obligatorios:
                            </span>
                            <div class="flex flex-wrap justify-end gap-2 max-w-md">
                                @for (field of invalidFields(); track field) {
                                    <span class="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black border border-red-200">
                                        {{ field }}
                                    </span>
                                }
                            </div>
                        </div>
                    }
                    <button type="submit" 
                        [disabled]="rdaForm.invalid"
                        (click)="onSubmit()"
                        class="px-12 py-4 bg-black text-white text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_rgba(6,182,212,0.3)] disabled:opacity-30 disabled:cursor-not-allowed">
                        Guardar Registro Digital (RDA)
                    </button>
                }
            </div>
        </form>
    </div>
    `,
    styles: [`
        :host { display: block; }
        .is-read-only input, .is-read-only textarea, .is-read-only select {
            background-color: #f8fafc !important;
            color: #475569 !important;
            border-color: #000 !important;
            pointer-events: none !important;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 10rem;
            font-weight: 900;
            color: rgba(0,0,0,0.03);
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
            text-transform: uppercase;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RdaFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);

    @Input({ required: true }) patientId!: string;
    @Input({ required: true }) appointmentId!: string;
    @Input({ required: true }) doctorId!: string;

    private _isReadOnly = false;
    @Input() set isReadOnly(value: boolean) {
        this._isReadOnly = value;
        if (value && this.rdaForm) {
            this.rdaForm.disable({ emitEvent: false });
        }
    }
    get isReadOnly(): boolean { return this._isReadOnly; }

    private _initialData: any = null;
    @Input() set initialData(value: any) {
        this._initialData = value;
        if (value && this.rdaForm) {
            this.handleExistingData(value);
        }
    }
    get initialData(): any { return this._initialData; }

    save = output<ClinicalRecordRDA>();

    protected rdaForm!: FormGroup;
    protected readonly showPediatric = signal(false);
    protected readonly initialIcdCodes = signal<IcdDiagnosis[]>([]);

    // Dictionary for user-friendly field names
    private readonly fieldLabels: Record<string, string> = {
        reasonForConsultation: 'Motivo de Consulta',
        currentIllness: 'Enfermedad Actual',
        physicalExamination: 'Descripción de Hallazgos',
        planAndTreatment: 'Tratamiento y Plan',
        recommendations: 'Recomendaciones',
        diagnoses: 'Diagnósticos (CIE-11)'
    };

    /**
     * Computed signal that tracks specifically which required fields are invalid
     */
    protected readonly invalidFields = signal<string[]>([]);

    constructor() {
        effect(() => {
            if (this.isReadOnly) {
                this.rdaForm?.disable({ emitEvent: false });
            }
        });
    }

    ngOnInit(): void {
        this.initForm();

        if (this.initialData) {
            this.handleExistingData(this.initialData);
        }
    }

    private handleExistingData(data: any): void {
        if (!this.rdaForm) return;

        const mappedData = {
            reasonForConsultation: data.reason,
            currentIllness: data.currentIllness,
            physicalExamination: data.physicalExamination?.content || '',
            vitalSigns: {
                heartRate: data.physicalExamination?.heartRate,
                respiratoryRate: data.physicalExamination?.respiratoryRate,
                temperature: data.physicalExamination?.temperature,
                systolicBloodPressure: data.physicalExamination?.systolicBloodPressure,
                diastolicBloodPressure: data.physicalExamination?.diastolicBloodPressure,
                weight: data.physicalExamination?.weight,
                height: data.physicalExamination?.height,
                isTaNotTaken: (data.physicalExamination && !data.physicalExamination.systolicBloodPressure)
            },
            planAndTreatment: data.plan,
            recommendations: data.recommendations || '',
            pediatricExtension: data.pediatricExtension,
            patientBackground: data.patientBackground
        };

        this.rdaForm.patchValue(mappedData);

        if (data.diagnoses && Array.isArray(data.diagnoses)) {
            this.diagnoses.clear();
            const initial: IcdDiagnosis[] = [];
            data.diagnoses.forEach((diag: any, index: number) => {
                const code = typeof diag === 'string' ? diag : diag.code;
                const description = typeof diag === 'string' ? 'Registro Cargado' : (diag.description || 'Registro Cargado');

                initial.push({ code, description });

                this.diagnoses.push(this.fb.group({
                    code: [code, Validators.required],
                    description: [description, Validators.required],
                    type: [diag.type || (index === 0 ? 'PRINCIPAL' : 'RELACIONADO'), Validators.required]
                }));
            });
            this.initialIcdCodes.set(initial);
        } else {
            this.diagnoses.clear();
            this.initialIcdCodes.set([]);
        }

        if (data.pediatricExtension) {
            this.showPediatric.set(true);
        }
    }

    private initForm(): void {
        this.rdaForm = this.fb.group({
            type: [RdaType.CONSULTA_EXTERNA],
            reasonForConsultation: ['', Validators.required],
            currentIllness: ['', Validators.required],
            physicalExamination: ['', Validators.required],
            vitalSigns: this.fb.group({
                heartRate: [null],
                respiratoryRate: [null],
                temperature: [null],
                systolicBloodPressure: [null],
                diastolicBloodPressure: [null],
                weight: [null],
                height: [null],
                isTaNotTaken: [false]
            }),
            diagnoses: this.fb.array([]),
            medications: this.fb.array([]),
            planAndTreatment: ['', Validators.required],
            recommendations: ['', Validators.required],
            pediatricExtension: this.fb.group({
                weight: [null],
                height: [null],
                cephalicPerimeter: [null],
                abdominalPerimeter: [null],
                perinatalHistory: ['']
            }),
            patientBackground: this.fb.group({
                pathological: [''],
                surgical: [''],
                allergic: [''],
                pharmacological: [''],
                familyHistory: [''],
                reviewOfSystems: ['']
            })
        });

        // Track changes to update invalid fields list
        this.rdaForm.statusChanges.subscribe(() => {
            this.updateInvalidFields();
        });

        this.updateInvalidFields();

        if (this.initialData) {
            this.handleExistingData(this.initialData);
        }

        if (this.isReadOnly) {
            this.rdaForm.disable({ emitEvent: false });
        }
    }

    get diagnoses() {
        return this.rdaForm.get('diagnoses') as FormArray;
    }

    protected onIcdSelectionChange(selection: IcdDiagnosis[]): void {
        this.diagnoses.clear();
        selection.forEach((diag, index) => {
            this.diagnoses.push(this.fb.group({
                code: [diag.code, Validators.required],
                description: [diag.description, Validators.required],
                type: [index === 0 ? 'PRINCIPAL' : 'RELACIONADO', Validators.required]
            }));
        });
        this.rdaForm.markAsDirty();
    }

    protected togglePediatric(): void {
        this.showPediatric.update(v => !v);
    }

    onSubmit(): void {
        if (this.rdaForm.valid) {
            const formValue = this.rdaForm.value;

            if (!this.showPediatric()) {
                delete formValue.pediatricExtension;
            }

            const rdaData: ClinicalRecordRDA = {
                ...formValue,
                patientId: this.patientId,
                appointmentId: this.appointmentId,
                doctorId: this.doctorId
            };
            this.save.emit(rdaData);
        }
    }

    private updateInvalidFields(): void {
        const invalid: string[] = [];
        const controls = this.rdaForm.controls;

        Object.keys(controls).forEach(key => {
            if (controls[key].invalid) {
                const label = this.fieldLabels[key] || key;
                invalid.push(label);
            }
        });

        this.invalidFields.set(invalid);
    }

    /**
     * Helper to get user-friendly error messages
     */
    protected getFieldError(controlName: string): string {
        const control = this.rdaForm.get(controlName);
        if (control?.hasError('required')) return 'Este campo es obligatorio';
        if (control?.hasError('pattern')) return 'Formato no válido';
        return 'Entrada no válida';
    }
}

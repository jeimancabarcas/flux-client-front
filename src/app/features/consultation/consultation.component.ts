import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { MedicalRecordService } from '../../core/services/medical-record.service';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';
import { CreateMedicalRecordDto } from '../../core/models/medical-record.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarComponent } from '../../shared/components/organisms/sidebar/sidebar.component';
import { HistoryLocalComponent } from './components/history-local/history-local.component';
import { HistoryInteroperableComponent } from './components/history-interoperable/history-interoperable.component';
import { RdaFormComponent } from './components/rda-manager/rda-form.component';
import { ClinicalRecordRDA } from '../../core/models/rda.model';
import { IcdSearchModalComponent } from '../../shared/components/molecules/icd-selector/icd-search-modal.component';
import { IcdModalService } from '../../core/services/icd-modal.service';

@Component({
    selector: 'app-consultation',
    standalone: true,
    imports: [
        CommonModule,
        SidebarComponent,
        HistoryLocalComponent,
        HistoryInteroperableComponent,
        RdaFormComponent,
        IcdSearchModalComponent
    ],
    template: `
    <div class="flex h-screen overflow-hidden bg-white font-['Inter'] selection:bg-black selection:text-white relative">
        <app-sidebar [isOpen]="isSidebarOpen()" (toggle)="isSidebarOpen.set(!isSidebarOpen())" />

        <main class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/30">
            <!-- Header Consultation Mode -->
            <header class="h-20 border-b-2 border-black bg-white flex items-center justify-between px-6 lg:px-12 flex-shrink-0 z-10">
                <div class="flex items-center gap-6">
                    <button (click)="exitConsultation()" class="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600 leading-none mb-1">Modo / Atención Activa</span>
                        <h2 class="text-xl font-black uppercase tracking-tighter text-black leading-none">
                            {{ appointment()?.patient?.nombres }} {{ appointment()?.patient?.apellidos }}
                        </h2>
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    <!-- Resource Buttons -->
                    <div class="flex border-2 border-black p-1 bg-slate-50 mr-4">
                        <button (click)="openResource('local')" 
                            class="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2 border-r-2 border-black">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.082.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Historia Local
                        </button>
                        <button (click)="openResource('interop')" 
                            class="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            IHCE (Nacional)
                        </button>
                    </div>
                    <div class="hidden md:flex flex-col items-end mr-4">
                        <span class="text-[9px] font-black uppercase text-slate-400">ID Paciente</span>
                        <span class="text-xs font-bold text-black">{{ appointment()?.patient?.numeroIdentificacion }}</span>
                    </div>
                    <button 
                        [disabled]="!isRecordSaved() || isLoading()" 
                        (click)="completeConsultation()" 
                        class="px-6 py-2 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
                        [title]="!isRecordSaved() ? 'Debe guardar el registro clínico antes de finalizar' : ''">
                        Finalizar Consulta
                    </button>
                </div>
            </header>

            <!-- Main Content Area -->
            <section class="flex-1 overflow-y-auto p-6 lg:p-12 relative scroll-smooth">
                @if (isLoading()) {
                    <div class="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-20">
                        <div class="w-12 h-12 border-4 border-black border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                }

                <div class="max-w-[1400px] mx-auto animate-enter">
                    @if (appointment(); as app) {
                        <div class="grid grid-cols-1 gap-12">
                            <!-- Floating Status Info -->
                            <div class="flex items-center justify-between p-6 bg-cyan-50 border-2 border-cyan-500 shadow-[8px_8px_0px_rgba(6,182,212,0.1)]">
                                <div class="flex flex-col">
                                    <span class="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600 mb-1">Protocolo de Atención</span>
                                    <p class="text-sm font-bold text-cyan-900 italic">"Garantizando la integridad clínica mediante el registro institucional RDA."</p>
                                </div>
                                <div class="flex gap-4">
                                    <div class="flex flex-col items-end">
                                        <span class="text-[9px] font-black text-cyan-600 uppercase">Consultorio</span>
                                        <span class="text-xs font-black uppercase">Flux Principal</span>
                                    </div>
                                </div>
                            </div>

                            <!-- MAIN RDA FORM (The Consultation) -->
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-3xl font-black uppercase tracking-tighter">Registro de Atención (RDA)</h3>
                                    
                                    @if (isRecordSaved() && !isCreatingNew()) {
                                        <button (click)="isCreatingNew.set(true)" 
                                            class="px-6 py-2 bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Nueva Evolución / Registro
                                        </button>
                                    } @else if (isCreatingNew()) {
                                        <button (click)="isCreatingNew.set(false)" 
                                            class="px-6 py-2 bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all flex items-center gap-2">
                                            Cancelar y Ver Guardados
                                        </button>
                                    }
                                </div>

                                <!-- SESSION TIMELINE / NAVIGATOR -->
                                @if (savedRecords().length > 0) {
                                    <div class="space-y-4 mb-8">
                                        <div class="flex items-center gap-3">
                                            <div class="h-[2px] flex-1 bg-slate-200"></div>
                                            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Línea de Tiempo de esta Sesión</span>
                                            <div class="h-[2px] flex-1 bg-slate-200"></div>
                                        </div>

                                        <div class="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                                            @for (record of savedRecords(); track record.id; let i = $index) {
                                                <div 
                                                    (click)="activeRecordIndex.set(i); isCreatingNew.set(false)"
                                                    [class.border-black]="activeRecordIndex() === i && !isCreatingNew()"
                                                    [class.bg-black]="activeRecordIndex() === i && !isCreatingNew()"
                                                    [class.text-white]="activeRecordIndex() === i && !isCreatingNew()"
                                                    [class.border-slate-200]="activeRecordIndex() !== i || isCreatingNew()"
                                                    [class.bg-white]="activeRecordIndex() !== i || isCreatingNew()"
                                                    class="min-w-[200px] p-4 border-2 cursor-pointer transition-all hover:border-black group animate-enter">
                                                    <div class="flex justify-between items-start mb-2">
                                                        <span class="text-[9px] font-black uppercase tracking-widest"
                                                            [class.text-slate-400]="activeRecordIndex() !== i || isCreatingNew()">
                                                            Registro #{{ savedRecords().length - i }}
                                                        </span>
                                                        <span class="text-[9px] font-bold"
                                                            [class.text-slate-300]="activeRecordIndex() !== i || isCreatingNew()">
                                                            {{ record.createdAt | date:'HH:mm' }}
                                                        </span>
                                                    </div>
                                                    <h5 class="text-[11px] font-black uppercase line-clamp-1 mb-1">{{ record.reason }}</h5>
                                                    <div class="flex flex-wrap gap-1">
                                                        @for (diag of record.diagnoses?.slice(0, 3); track $index) {
                                                            <span class="text-[7px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 uppercase italic">
                                                                {{ (diag?.code || diag) || '---' }}
                                                            </span>
                                                        }
                                                    </div>
                                                </div>
                                            }
                                            
                                            <!-- "New Record" placeholder if not creating -->
                                            @if (!isCreatingNew()) {
                                                <div 
                                                    (click)="isCreatingNew.set(true)"
                                                    class="min-w-[200px] p-4 border-2 border-dashed border-slate-300 bg-slate-50/50 cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all flex flex-col items-center justify-center gap-2 group">
                                                    <div class="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-all text-slate-400">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </div>
                                                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-cyan-600">Nueva Evolución</span>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }

                                <!-- FORM AREA -->
                                @if (isCreatingNew()) {
                                    <div class="animate-enter">
                                        <div class="flex items-center gap-4 mb-8">
                                            <div class="w-10 h-10 bg-cyan-600 text-white flex items-center justify-center font-black">NEW</div>
                                            <div>
                                                <h4 class="text-xl font-black uppercase tracking-tighter">Nueva Evolución Clínica</h4>
                                                <p class="text-[10px] font-bold text-slate-400 uppercase">Añadiendo información adicional a la consulta actual</p>
                                            </div>
                                        </div>

                                        <app-rda-form 
                                            [patientId]="app.patientId" 
                                            [appointmentId]="app.id" 
                                            [doctorId]="app.doctorId"
                                            [isReadOnly]="false"
                                            [initialData]="lastRecordBackgroundOnly()"
                                            (save)="onSaveRda($event)" />
                                    </div>
                                } @else {
                                    <div class="animate-enter">
                                        @if (savedRecords().length > 0) {
                                            <div class="flex items-center gap-4 mb-8">
                                                <div class="w-10 h-10 bg-black text-white flex items-center justify-center font-black">#{{ savedRecords().length - activeRecordIndex() }}</div>
                                                <div>
                                                    <h4 class="text-xl font-black uppercase tracking-tighter">Resumen del Registro Guardado</h4>
                                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registrado a las {{ savedRecords()[activeRecordIndex()].createdAt | date:'HH:mm:ss' }} - Modo Solo Lectura</p>
                                                </div>
                                            </div>
                                        }

                                        <app-rda-form 
                                            [patientId]="app.patientId" 
                                            [appointmentId]="app.id" 
                                            [doctorId]="app.doctorId"
                                            [isReadOnly]="isRecordSaved()"
                                            [initialData]="savedRecords()[activeRecordIndex()]"
                                            (save)="onSaveRda($event)" />
                                    </div>
                                }
                        </div>
                    }
                </div>
            </section>

            <!-- Slide-over Resource Panels -->
            <!-- Local History Panel -->
            <div 
                [class.translate-x-0]="activeResource() === 'local'"
                [class.translate-x-full]="activeResource() !== 'local'"
                class="fixed right-0 top-0 w-full md:w-[600px] h-full bg-white border-l-4 border-black z-[100] transition-transform duration-500 ease-in-out shadow-2xl flex flex-col"
            >
                <div class="h-20 border-b-2 border-black flex items-center justify-between px-8 bg-slate-50">
                    <div class="flex flex-col">
                        <span class="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Recurso Clínico</span>
                        <h4 class="text-lg font-black uppercase tracking-tighter">Historia Clínica Local</h4>
                    </div>
                    <button (click)="closeResource()" class="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    @if (appointment()) {
                        <app-history-local [patientId]="appointment()!.patientId" />
                    }
                </div>
            </div>

            <!-- Interop History Panel -->
            <div 
                [class.translate-x-0]="activeResource() === 'interop'"
                [class.translate-x-full]="activeResource() !== 'interop'"
                class="fixed right-0 top-0 w-full md:w-[600px] h-full bg-white border-l-4 border-black z-[100] transition-transform duration-500 ease-in-out shadow-2xl flex flex-col"
            >
                <div class="h-20 border-b-2 border-black flex items-center justify-between px-8 bg-slate-50">
                    <div class="flex flex-col">
                        <span class="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-600">Interoperabilidad IHCE</span>
                        <h4 class="text-lg font-black uppercase tracking-tighter">Historia Clínica Nacional</h4>
                    </div>
                    <button (click)="closeResource()" class="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div class="mb-6 flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest self-start">
                        <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        Enlace Minsalud Activo
                    </div>
                    @if (appointment()) {
                        <app-history-interoperable [patientId]="appointment()!.patientId" />
                    }
                </div>
            </div>

            <!-- Backdrop for panels -->
            @if (activeResource()) {
                <div 
                    (click)="closeResource()"
                    class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] animate-fade-in"
                ></div>
            }

            @if (icdModalService.isOpen()) {
                <app-icd-search-modal />
            }
        </main>
    </div>
    `,
    styles: [`
        .animate-enter {
            animation: enter 0.4s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @keyframes enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultationComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly appointmentService = inject(AppointmentService);
    private readonly medicalRecordService = inject(MedicalRecordService);
    protected readonly icdModalService = inject(IcdModalService);

    protected readonly appointmentId = signal<string | null>(null);
    protected readonly appointment = signal<Appointment | null>(null);
    protected readonly isLoading = signal(true);
    protected readonly isSidebarOpen = signal(false);
    protected readonly activeResource = signal<'local' | 'interop' | null>(null);
    protected readonly isRecordSaved = signal(false);
    protected readonly savedRecords = signal<any[]>([]);
    protected readonly isCreatingNew = signal(false);
    protected readonly activeRecordIndex = signal<number>(0);

    protected readonly lastRecordBackgroundOnly = computed(() => {
        const records = this.savedRecords();
        if (records.length === 0) return null;
        // Solo retornamos los antecedentes del último registro para pre-poblar el nuevo
        return {
            patientBackground: records[0].patientBackground
        };
    });

    openResource(type: 'local' | 'interop'): void {
        this.activeResource.set(type);
    }

    closeResource(): void {
        this.activeResource.set(null);
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.appointmentId.set(id);
            this.loadAppointmentDetails(id);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    private loadAppointmentDetails(id: string): void {
        this.isLoading.set(true);

        const appointment$ = this.appointmentService.getAppointmentById(id);
        const medicalRecord$ = this.medicalRecordService.getRecordByAppointment(id).pipe(
            catchError(() => of({ success: false, data: null }))
        );

        forkJoin([appointment$, medicalRecord$]).subscribe({
            next: ([appRes, mrRes]) => {
                if (appRes.success && appRes.data) {
                    this.appointment.set(appRes.data);
                    if (appRes.data.status === AppointmentStatus.PENDIENTE || appRes.data.status === AppointmentStatus.CONFIRMADA) {
                        this.updateStatus(id);
                    }
                }
                if (mrRes.success && mrRes.data) {
                    console.log('Historias clínicas para esta cita:', mrRes.data);
                    const records = Array.isArray(mrRes.data) ? mrRes.data : [mrRes.data];
                    this.savedRecords.set(records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                    this.isRecordSaved.set(true);
                    this.activeRecordIndex.set(0);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.router.navigate(['/dashboard']);
            }
        });
    }

    private updateStatus(id: string): void {
        this.appointmentService.startAppointment(id).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.appointment.set(res.data);
                }
            }
        });
    }

    protected onSaveRda(rdaData: any): void {
        this.isLoading.set(true);

        // Registrar Historia Clínica (Nuevo Endpoint Estándar)
        const medicalRecordDto: CreateMedicalRecordDto = {
            appointmentId: rdaData.appointmentId,
            patientId: rdaData.patientId,
            reason: rdaData.reasonForConsultation,
            currentIllness: rdaData.currentIllness,
            physicalExamination: {
                content: rdaData.physicalExamination,
                heartRate: rdaData.vitalSigns?.heartRate,
                respiratoryRate: rdaData.vitalSigns?.respiratoryRate,
                temperature: rdaData.vitalSigns?.temperature,
                systolicBloodPressure: rdaData.vitalSigns?.systolicBloodPressure,
                diastolicBloodPressure: rdaData.vitalSigns?.diastolicBloodPressure,
                weight: rdaData.vitalSigns?.weight,
                height: rdaData.vitalSigns?.height
            },
            diagnoses: rdaData.diagnoses || [],
            plan: rdaData.planAndTreatment,
            pediatricExtension: rdaData.pediatricExtension,
            patientBackground: rdaData.patientBackground
        };

        this.medicalRecordService.registerMedicalRecord(medicalRecordDto).subscribe({
            next: (res) => {
                if (res.success) {
                    console.log('Atención registrada exitosamente');
                    const newRecords = [res.data, ...this.savedRecords()];
                    this.savedRecords.set(newRecords);
                    this.isRecordSaved.set(true);
                    this.isCreatingNew.set(false);
                    this.activeRecordIndex.set(0);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected completeConsultation(): void {
        const id = this.appointmentId();
        if (id) {
            this.isLoading.set(true);
            this.appointmentService.completeAppointment(id, 'Consulta finalizada por el médico.').subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.exitConsultation();
                },
                error: () => this.isLoading.set(false)
            });
        }
    }

    protected exitConsultation(): void {
        this.router.navigate(['/dashboard']);
    }
}

import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { RdaService } from '../../core/services/rda.service';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';
import { CardComponent } from '../../shared/components/atoms/card/card.component';
import { SidebarComponent } from '../../shared/components/organisms/sidebar/sidebar.component';
import { HistoryLocalComponent } from './components/history-local/history-local.component';
import { HistoryInteroperableComponent } from './components/history-interoperable/history-interoperable.component';
import { RdaFormComponent } from './components/rda-manager/rda-form.component';
import { ClinicalRecordRDA } from '../../core/models/rda.model';

@Component({
    selector: 'app-consultation',
    standalone: true,
    imports: [
        CommonModule,
        CardComponent,
        SidebarComponent,
        HistoryLocalComponent,
        HistoryInteroperableComponent,
        RdaFormComponent
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
                    <button (click)="completeConsultation()" class="px-6 py-2 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
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
                            <div class="space-y-8">
                                <h3 class="text-3xl font-black uppercase tracking-tighter mb-4">Registro de Atención (RDA)</h3>
                                <app-rda-form 
                                    [patientId]="app.patientId" 
                                    [appointmentId]="app.id" 
                                    [doctorId]="app.doctorId"
                                    [initialItemIds]="app.itemIds || []"
                                    (save)="onSaveRda($event)" />
                            </div>
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
    private readonly rdaService = inject(RdaService);

    protected readonly appointmentId = signal<string | null>(null);
    protected readonly appointment = signal<Appointment | null>(null);
    protected readonly isLoading = signal(true);
    protected readonly isSidebarOpen = signal(false);
    protected readonly activeResource = signal<'local' | 'interop' | null>(null);

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
        this.appointmentService.getAppointmentById(id).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.appointment.set(res.data);
                    if (res.data.status === AppointmentStatus.PENDIENTE || res.data.status === AppointmentStatus.CONFIRMADA) {
                        this.updateStatus(id);
                    }
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

    protected onSaveRda(rda: ClinicalRecordRDA): void {
        this.isLoading.set(true);
        this.rdaService.createRda(rda).subscribe({
            next: (res) => {
                if (res.success) {
                    // Solo informar éxito por ahora, el cierre es manual
                    console.log('RDA guardado exitosamente');
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

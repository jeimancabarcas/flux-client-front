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
                    <div class="hidden md:flex flex-col items-end mr-4">
                        <span class="text-[9px] font-black uppercase text-slate-400">ID Paciente</span>
                        <span class="text-xs font-bold text-black">{{ appointment()?.patient?.numeroIdentificacion }}</span>
                    </div>
                    <button (click)="completeConsultation()" class="px-6 py-2 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                        Finalizar Consulta
                    </button>
                </div>
            </header>

            <!-- Secondary Navigation (Tabs) -->
            <nav class="bg-white border-b-2 border-black flex flex-wrap flex-shrink-0">
                @for (tab of tabs; track tab.id) {
                    <button 
                        (click)="activeTab.set(tab.id)"
                        [class]="'px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-r-2 border-black relative ' + 
                                (activeTab() === tab.id ? 'bg-black text-white' : 'hover:bg-slate-50 text-slate-400')"
                    >
                        {{ tab.label }}
                        @if (activeTab() === tab.id) {
                            <div class="absolute bottom-0 left-0 w-full h-1 bg-cyan-500"></div>
                        }
                    </button>
                }
            </nav>

            <!-- Main Content Area -->
            <section class="flex-1 overflow-y-auto p-6 lg:p-12 relative">
                @if (isLoading()) {
                    <div class="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-20">
                        <div class="w-12 h-12 border-4 border-black border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                }

                <div class="max-w-[1400px] mx-auto animate-enter">
                    @if (appointment(); as app) {
                        <app-card customClass="p-10 min-h-[60vh]">
                            @switch (activeTab()) {
                                @case ('history-local') {
                                    <div class="space-y-8">
                                        <h3 class="text-3xl font-black uppercase tracking-tighter mb-8">Historia Clínica Local</h3>
                                        <app-history-local [patientId]="app.patientId" />
                                    </div>
                                }
                                @case ('history-interoperable') {
                                    <div class="space-y-8">
                                        <div class="flex items-center justify-between mb-8">
                                            <h3 class="text-3xl font-black uppercase tracking-tighter">Historia Interoperable (IHCE)</h3>
                                            <div class="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
                                                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                Sincronizado con Minsalud
                                            </div>
                                        </div>
                                        <app-history-interoperable [patientId]="app.patientId" />
                                    </div>
                                }
                                @case ('rda-management') {
                                    <div class="space-y-8">
                                        <h3 class="text-3xl font-black uppercase tracking-tighter mb-8">Gestión de RDA (Atención en Curso)</h3>
                                        <app-rda-form 
                                            [patientId]="app.patientId" 
                                            [appointmentId]="app.id" 
                                            [doctorId]="app.doctorId"
                                            (save)="onSaveRda($event)" />
                                    </div>
                                }
                            }
                        </app-card>
                    }
                </div>
            </section>
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
    protected readonly activeTab = signal('history-local');

    protected readonly tabs = [
        { id: 'history-local', label: 'Historia Clínica (Consultorio)' },
        { id: 'history-interoperable', label: 'Historia Clínica (Interoperable IHCE)' },
        { id: 'rda-management', label: 'Gestión de RDA (Registro de Atención)' }
    ];

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

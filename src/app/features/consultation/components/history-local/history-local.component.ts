import { Component, OnInit, signal, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalRecordService } from '../../../../core/services/medical-record.service';
import { MedicalRecordHistoryItem } from '../../../../core/models/medical-record.model';

@Component({
    selector: 'app-history-local',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-10">
        @if (isLoading()) {
            <div class="space-y-6">
                @for (i of [1,2]; track i) {
                    <div class="h-64 bg-slate-100 border-2 border-slate-200 animate-pulse"></div>
                }
            </div>
        } @else if (medicalRecords().length === 0) {
            <div class="py-20 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <svg class="w-16 h-16 text-slate-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 class="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Sin historial registrado en Flux</h4>
                <p class="text-[10px] font-bold text-slate-300 mt-2 uppercase">Este paciente no tiene atenciones previas en este consultorio.</p>
            </div>
        } @else {
            <div class="space-y-12 pb-10">
                <div class="space-y-8">
                    <h5 class="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 border-b-2 border-cyan-100 pb-2">Historias Clínicas Locales</h5>
                    
                    @for (mr of medicalRecords(); track mr.id) {
                        <div class="animate-enter bg-white border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.05)] overflow-hidden">
                            <!-- Header Bar -->
                            <div class="px-6 py-3 bg-slate-50 border-b-2 border-black flex items-center justify-between">
                                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {{ mr.createdAt | date:'medium' }}
                                </span>
                                <div class="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                            </div>

                            <!-- Content Body -->
                            <div class="p-8">
                                <div class="flex flex-wrap gap-8">
                                    <div class="flex-1 min-w-[280px] space-y-2">
                                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Motivo de Consulta</span>
                                        <h6 class="text-sm font-black uppercase tracking-tight text-black leading-tight">{{ mr.reason }}</h6>
                                    </div>

                                    <div class="flex-[2] min-w-[300px] space-y-2">
                                        <span class="text-[9px] font-black uppercase tracking-widest text-cyan-600 border-b border-cyan-100 block pb-1">Enfermedad Reportada</span>
                                        <p class="text-[12px] font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {{ mr.currentIllness || 'Información no disponible en este registro.' }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>

                <!-- Load More Section -->
                <div class="flex flex-col items-center justify-center pt-8 border-t-2 border-dashed border-slate-100">
                    @if (hasMore()) {
                        <button 
                            (click)="loadMore()"
                            [disabled]="isLoadingMore()"
                            class="group relative px-10 py-4 bg-white border-2 border-black transition-all hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
                            
                            <div class="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
                            
                            <div class="flex items-center gap-3">
                                @if (isLoadingMore()) {
                                    <div class="w-4 h-4 border-2 border-slate-200 border-t-black rounded-full animate-spin"></div>
                                }
                                <span class="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {{ isLoadingMore() ? 'Cargando registros...' : 'Cargar más historias' }}
                                </span>
                            </div>
                        </button>
                    } @else if (medicalRecords().length > 0) {
                        <div class="flex flex-col items-center gap-2 py-4 grayscale opacity-40">
                            <div class="w-12 h-[2px] bg-slate-300 mb-2"></div>
                            <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">No hay más historias clínicas para este paciente</span>
                        </div>
                    }
                </div>
            </div>
        }
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
export class HistoryLocalComponent implements OnInit {
    private readonly medicalRecordService = inject(MedicalRecordService);

    patientId = input.required<string>();

    protected readonly medicalRecords = signal<MedicalRecordHistoryItem[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly isLoadingMore = signal(false);
    protected readonly hasMore = signal(true);

    private currentPage = 1;
    private readonly limit = 5;

    ngOnInit(): void {
        this.loadHistory();
    }

    private loadHistory(): void {
        this.isLoading.set(true);
        this.currentPage = 1;
        this.medicalRecordService.getHistoryByPatient(this.patientId(), this.currentPage, this.limit).subscribe({
            next: (res) => {
                if (res.success) {
                    this.medicalRecords.set(res.data);
                    this.hasMore.set(res.data.length === this.limit);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.hasMore.set(false);
            }
        });
    }

    protected loadMore(): void {
        if (this.isLoadingMore() || !this.hasMore()) return;

        this.isLoadingMore.set(true);
        this.currentPage++;

        this.medicalRecordService.getHistoryByPatient(this.patientId(), this.currentPage, this.limit).subscribe({
            next: (res) => {
                if (res.success && res.data.length > 0) {
                    this.medicalRecords.update(prev => [...prev, ...res.data]);
                    this.hasMore.set(res.data.length === this.limit);
                } else {
                    this.hasMore.set(false);
                }
                this.isLoadingMore.set(false);
            },
            error: () => {
                this.isLoadingMore.set(false);
                this.hasMore.set(false);
            }
        });
    }
}

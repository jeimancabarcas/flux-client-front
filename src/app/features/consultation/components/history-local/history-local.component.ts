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
            <div class="space-y-12">
                <!-- Historias Clínicas Locales (Estandarizadas) -->
                <div class="space-y-6">
                    <h5 class="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 border-b-2 border-cyan-100 pb-2">Historias Clínicas Locales</h5>
                    @for (mr of medicalRecords(); track mr.id) {
                        <div class="animate-enter group">
                            <div 
                                (click)="toggleExpand(mr.id)"
                                class="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50">
                                <div class="flex flex-col gap-1">
                                    <span class="text-[9px] font-black text-slate-400 uppercase">{{ mr.createdAt | date:'medium' }}</span>
                                    <h6 class="text-sm font-black uppercase tracking-tight group-hover:text-cyan-600 transition-colors">{{ mr.reason }}</h6>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        @for (code of mr.diagnoses; track code) {
                                            <span class="text-[9px] font-bold bg-cyan-50 text-cyan-700 px-1.5 py-0.5 border border-cyan-100 uppercase">Dx: {{ code }}</span>
                                        }
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    @if (mr.pediatricExtension) {
                                        <span class="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest">Pediátrico</span>
                                    }
                                    <svg class="w-5 h-5 transition-transform duration-300" [class.rotate-180]="expandedRecordId() === mr.id" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            
                            @if (expandedRecordId() === mr.id) {
                                <div class="p-8 bg-slate-50 border-x-2 border-b-2 border-black animate-enter space-y-8">
                                    <!-- Background summary -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        @if (mr.patientBackground) {
                                            <div class="space-y-4">
                                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 block pb-1">Antecedentes Registrados</span>
                                                <div class="grid grid-cols-1 gap-3">
                                                    @if (mr.patientBackground.pathological) {
                                                        <div class="flex flex-col"><span class="text-[8px] font-black uppercase text-slate-400">Pat:</span><p class="text-[10px] font-bold">{{ mr.patientBackground.pathological }}</p></div>
                                                    }
                                                    @if (mr.patientBackground.surgical) {
                                                        <div class="flex flex-col"><span class="text-[8px] font-black uppercase text-slate-400">Quir:</span><p class="text-[10px] font-bold">{{ mr.patientBackground.surgical }}</p></div>
                                                    }
                                                    @if (mr.patientBackground.allergic) {
                                                        <div class="flex flex-col"><span class="text-[8px] font-black uppercase text-red-400">Alér:</span><p class="text-[10px] font-bold text-red-600">{{ mr.patientBackground.allergic }}</p></div>
                                                    }
                                                </div>
                                            </div>
                                            <div class="space-y-4">
                                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 block pb-1">Revisión de Sistemas</span>
                                                <p class="text-[11px] font-medium italic text-slate-600">
                                                    {{ mr.patientBackground.reviewOfSystems || 'No registrada en este folio.' }}
                                                </p>
                                            </div>
                                        } @else {
                                            <p class="text-[10px] font-bold text-slate-400 uppercase italic">Sin antecedentes capturados en este registro.</p>
                                        }
                                    </div>
                                </div>
                            }
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
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryLocalComponent implements OnInit {
    private readonly medicalRecordService = inject(MedicalRecordService);

    patientId = input.required<string>();

    protected readonly medicalRecords = signal<MedicalRecordHistoryItem[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly expandedRecordId = signal<string | null>(null);

    toggleExpand(id: string): void {
        if (this.expandedRecordId() === id) {
            this.expandedRecordId.set(null);
        } else {
            this.expandedRecordId.set(id);
        }
    }

    ngOnInit(): void {
        this.loadHistory();
    }

    private loadHistory(): void {
        this.isLoading.set(true);
        this.medicalRecordService.getHistoryByPatient(this.patientId()).subscribe({
            next: (res) => {
                if (res.success) {
                    this.medicalRecords.set(res.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }
}

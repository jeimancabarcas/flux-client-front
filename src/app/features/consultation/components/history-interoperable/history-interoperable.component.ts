import { Component, OnInit, signal, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RdaService } from '../../../../core/services/rda.service';
import { ClinicalRecordRDA } from '../../../../core/models/rda.model';
import { RdaViewerComponent } from '../rda-viewer/rda-viewer.component';

@Component({
    selector: 'app-history-interoperable',
    standalone: true,
    imports: [CommonModule, RdaViewerComponent],
    template: `
    <div class="space-y-10">
        <!-- Interoperability Status Banner -->
        <div class="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-500 shadow-[4px_4px_0px_rgba(16,185,129,0.2)]">
            <div class="flex items-center gap-4">
                <div class="p-2 bg-emerald-500 text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                </div>
                <div>
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-emerald-700 leading-none mb-1">Conexión IHCE Establecida</h5>
                    <p class="text-[9px] font-bold text-emerald-600 uppercase">Resumen Digital de Atención (RDA) - Resolución 1888/2025</p>
                </div>
            </div>
            <button (click)="loadHistory()" class="px-4 py-2 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-white text-[9px] font-black uppercase transition-all">Sincronizar</button>
        </div>

        @if (isLoading()) {
            <div class="space-y-6">
                @for (i of [1,2]; track i) {
                    <div class="h-64 bg-slate-100 border-2 border-slate-200 animate-pulse"></div>
                }
            </div>
        } @else if (records().length === 0) {
            <div class="py-20 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <svg class="w-16 h-16 text-slate-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Sin hallazgos externos interoperables</h4>
                <p class="text-[10px] font-bold text-slate-300 mt-2 uppercase">No se detectaron registros en el nodo central del Ministerio para este paciente.</p>
            </div>
        } @else {
            <div class="space-y-12">
                @for (record of records(); track record.id) {
                    <div class="animate-enter relative" [style.animation-delay]="$index * 0.1 + 's'">
                        <!-- Badge of Origin -->
                        <div class="absolute -left-2 top-10 z-10 px-2 py-1 bg-cyan-600 text-white text-[8px] font-black uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
                            ORIGEN EXTERNO
                        </div>
                        <app-rda-viewer [rda]="record" />
                    </div>
                }
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
export class HistoryInteroperableComponent implements OnInit {
    private readonly rdaService = inject(RdaService);

    patientId = input.required<string>();

    protected readonly records = signal<ClinicalRecordRDA[]>([]);
    protected readonly isLoading = signal(true);

    ngOnInit(): void {
        this.loadHistory();
    }

    protected loadHistory(): void {
        this.isLoading.set(true);
        this.rdaService.getInteroperableHistory(this.patientId()).subscribe({
            next: (res) => {
                if (res.success) {
                    this.records.set(res.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }
}

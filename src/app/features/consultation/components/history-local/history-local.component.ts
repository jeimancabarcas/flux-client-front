import { Component, OnInit, signal, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RdaService } from '../../../../core/services/rda.service';
import { ClinicalRecordRDA } from '../../../../core/models/rda.model';
import { RdaViewerComponent } from '../rda-viewer/rda-viewer.component';

@Component({
    selector: 'app-history-local',
    standalone: true,
    imports: [CommonModule, RdaViewerComponent],
    template: `
    <div class="space-y-10">
        @if (isLoading()) {
            <div class="space-y-6">
                @for (i of [1,2]; track i) {
                    <div class="h-64 bg-slate-100 border-2 border-slate-200 animate-pulse"></div>
                }
            </div>
        } @else if (records().length === 0) {
            <div class="py-20 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <svg class="w-16 h-16 text-slate-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 class="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Sin historial registrado en Flux</h4>
                <p class="text-[10px] font-bold text-slate-300 mt-2 uppercase">Este paciente no tiene atenciones previas en este consultorio.</p>
            </div>
        } @else {
            <div class="space-y-12">
                @for (record of records(); track record.id) {
                    <div class="animate-enter" [style.animation-delay]="$index * 0.1 + 's'">
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
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryLocalComponent implements OnInit {
    private readonly rdaService = inject(RdaService);

    patientId = input.required<string>();

    protected readonly records = signal<ClinicalRecordRDA[]>([]);
    protected readonly isLoading = signal(true);

    ngOnInit(): void {
        this.loadHistory();
    }

    private loadHistory(): void {
        this.isLoading.set(true);
        this.rdaService.getLocalHistory(this.patientId()).subscribe({
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

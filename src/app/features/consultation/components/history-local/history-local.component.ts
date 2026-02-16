import { Component, OnInit, signal, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalRecordService } from '../../../../core/services/medical-record.service';
import { MedicalRecordHistoryItem } from '../../../../core/models/medical-record.model';
import { DataTableComponent } from '../../../../shared/components/organisms/data-table/data-table.component';

@Component({
    selector: 'app-history-local',
    standalone: true,
    imports: [CommonModule, DataTableComponent],
    template: `
    <div class="space-y-6">
        <div class="flex items-center gap-4 border-b-2 border-cyan-100 pb-2">
            <h5 class="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">Registros Clínicos Locales</h5>
        </div>

        <app-data-table
            [headers]="['Fecha', 'Motivo de Consulta', 'Enfermedad Reportada', 'Diagnósticos']"
            [data]="medicalRecords()"
            [isLoading]="isLoading()"
            [page]="currentPage()"
            [hasMore]="hasMore()"
            emptyMessage="Sin historial local registrado."
            (pageChange)="onPageChange($event)">

            <ng-template #rowTemplate let-mr>
                <td class="px-6 py-5">
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] font-black text-black uppercase">{{ mr.createdAt | date:'dd/MM/yyyy' }}</span>
                        <span class="text-[9px] font-bold text-slate-400 uppercase italic">{{ mr.createdAt | date:'HH:mm' }}</span>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[11px] font-black text-black uppercase leading-tight tracking-tight">
                        {{ mr.reason }}
                    </p>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[11px] font-medium text-slate-600 leading-relaxed truncate max-w-[200px]">
                        {{ mr.currentIllness || 'N/A' }}
                    </p>
                </td>
                <td class="px-6 py-5">
                    <div class="flex flex-wrap gap-1">
                        @if (mr.diagnoses && mr.diagnoses.length > 0) {
                            @for (diag of mr.diagnoses; track diag.code || diag) {
                                <span class="px-1.5 py-0.5 bg-black text-white text-[8px] font-black italic border border-black italic">
                                    {{ diag.code || diag }}
                                </span>
                            }
                        } @else {
                            <span class="text-[9px] font-bold text-slate-300">--</span>
                        }
                    </div>
                </td>
            </ng-template>
        </app-data-table>
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryLocalComponent implements OnInit {
    private readonly medicalRecordService = inject(MedicalRecordService);

    patientId = input.required<string>();

    protected readonly medicalRecords = signal<MedicalRecordHistoryItem[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly hasMore = signal(false);
    protected readonly currentPage = signal(1);

    private readonly limit = 5;

    ngOnInit(): void {
        this.loadHistory();
    }

    protected loadHistory(): void {
        this.isLoading.set(true);
        this.medicalRecordService.getHistoryByPatient(this.patientId(), this.currentPage(), this.limit).subscribe({
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

    protected onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadHistory();
    }
}

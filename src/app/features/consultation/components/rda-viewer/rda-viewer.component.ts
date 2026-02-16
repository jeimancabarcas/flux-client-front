import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClinicalRecordRDA } from '../../../../core/models/rda.model';
import { CardComponent } from '../../../../shared/components/atoms/card/card.component';

@Component({
    selector: 'app-rda-viewer',
    standalone: true,
    imports: [CommonModule, CardComponent],
    template: `
    <app-card customClass="p-8 space-y-8">
        <!-- Header: Type and Date -->
        <div class="flex items-center justify-between border-b-2 border-slate-100 pb-6">
            <div class="flex flex-col">
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 mb-1">Registro Digital / {{ rda().type }}</span>
                <h4 class="text-xl font-black uppercase tracking-tighter">{{ rda().createdAt | date:'longDate':'':'es' }}</h4>
            </div>
            <div class="flex flex-col items-end">
                <span class="text-[9px] font-black uppercase text-slate-400">Atención #</span>
                <span class="text-xs font-bold text-black font-mono">ID-{{ rda().appointmentId.substring(0,8) }}</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <!-- Left Column: Narrative -->
            <div class="space-y-8">
                <div class="space-y-2">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo de Consulta</h5>
                    <p class="text-sm font-medium leading-relaxed text-black italic">"{{ rda().reasonForConsultation }}"</p>
                </div>

                <div class="space-y-2">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Enfermedad Actual</h5>
                    <p class="text-sm font-medium leading-relaxed text-slate-700">{{ rda().currentIllness }}</p>
                </div>

                <div class="space-y-2">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Examen Físico</h5>
                    <p class="text-sm font-medium leading-relaxed text-slate-700">{{ rda().physicalExamination }}</p>
                </div>
            </div>

            <!-- Right Column: Technical Data -->
            <div class="space-y-8">
                <!-- Vitals Summary -->
                @if (rda().vitalSigns) {
                    <div class="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200">
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black text-slate-400 uppercase">T.A</span>
                            <span class="text-xs font-black">{{ rda().vitalSigns?.bloodPressure || '--/--' }}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black text-slate-400 uppercase">F.C</span>
                            <span class="text-xs font-black">{{ rda().vitalSigns?.heartRate || '--' }} <small class="text-[8px]">LPM</small></span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black text-slate-400 uppercase">Temp</span>
                            <span class="text-xs font-black">{{ rda().vitalSigns?.temperature || '--' }} <small class="text-[8px]">°C</small></span>
                        </div>
                    </div>
                }

                <!-- Diagnoses List -->
                <div class="space-y-3">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Impresión Diagnóstica</h5>
                    <div class="space-y-2">
                        @for (diag of rda().diagnoses; track $index) {
                            <div class="flex items-start gap-3 p-3 border border-black bg-white">
                                <span class="px-2 py-0.5 bg-black text-white text-[9px] font-black inline-block">{{ diag?.code || diag }}</span>
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold leading-none text-black">{{ diag?.description || 'Diagnóstico Migrado' }}</span>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <!-- Conduct/Plan -->
                <div class="p-5 border-2 border-cyan-500 bg-cyan-50/20 space-y-3">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-cyan-700">Conducta y Plan</h5>
                    <p class="text-xs font-bold text-slate-700 whitespace-pre-line">{{ rda().planAndTreatment }}</p>
                </div>
            </div>
        </div>
    </app-card>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RdaViewerComponent {
    rda = input.required<ClinicalRecordRDA>();
}

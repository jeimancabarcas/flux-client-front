import { Component, OnInit, signal, output, input, ChangeDetectionStrategy, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IcdDiagnosis } from '../../../../core/models/icd.model';
import { IcdModalService } from '../../../../core/services/icd-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-icd-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Label & Action Header -->
      <div class="flex items-center justify-between">
        @if (label()) {
          <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {{ label() }}
          </label>
        }
        
        <button 
          type="button"
          (click)="openModal()"
          class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar Diagnóstico (OMS)
        </button>
      </div>

      <!-- Selected Chips Display -->
      @if (selectedDiagnoses().length > 0) {
        <div class="flex flex-wrap gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200 min-h-[60px] animate-enter">
          @for (diag of selectedDiagnoses(); track diag.code) {
            <div class="flex items-center gap-2 bg-black text-white px-3 py-1.5 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] group hover:translate-y-[-1px] transition-all">
              <span class="text-[9px] font-black bg-white text-black px-1.5 py-0.5 italic">{{ diag.code }}</span>
              <span class="text-[10px] font-bold uppercase truncate max-w-[250px]">{{ diag.description }}</span>
              <button 
                type="button"
                (click)="removeDiagnosis(diag)" 
                class="hover:text-red-400 transition-colors ml-1 p-0.5 border border-white/20 hover:border-red-400"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
        </div>
      } @else {
        <div 
          (click)="openModal()"
          class="p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-slate-50 transition-colors opacity-60"
        >
          <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Clic para buscar e integrar diagnósticos</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-enter {
      animation: enter 0.3s cubic-bezier(0, 0, 0.2, 1) both;
    }
    @keyframes enter {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IcdSelectorComponent implements OnInit, OnDestroy {
  private readonly modalService = inject(IcdModalService);
  private subscription = new Subscription();

  // Inputs/Outputs
  label = input<string>('Diagnósticos CIE-11');
  initialSelection = input<IcdDiagnosis[]>([]);
  selectionChange = output<IcdDiagnosis[]>();

  // State
  selectedDiagnoses = signal<IcdDiagnosis[]>([]);

  constructor() {
    // Sync internal state with input changes (important for switching between records)
    effect(() => {
      const initial = this.initialSelection();
      this.selectedDiagnoses.set([...initial]);
    });
  }

  ngOnInit(): void {
    // Subscribe to selections from the global modal
    this.subscription.add(
      this.modalService.selection$.subscribe(diag => {
        this.onDiagnosisSelected(diag);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openModal(): void {
    this.modalService.open();
  }

  private onDiagnosisSelected(diag: IcdDiagnosis): void {
    if (!this.selectedDiagnoses().some(d => d.code === diag.code)) {
      this.selectedDiagnoses.update(list => [...list, diag]);
      this.selectionChange.emit(this.selectedDiagnoses());
    }
  }

  removeDiagnosis(diag: IcdDiagnosis): void {
    this.selectedDiagnoses.update(list => list.filter(d => d.code !== diag.code));
    this.selectionChange.emit(this.selectedDiagnoses());
  }
}

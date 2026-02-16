import { Component, signal, inject, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';
import { IcdService } from '../../../../core/services/icd.service';
import { IcdDiagnosis } from '../../../../core/models/icd.model';
import { ModalComponent } from '../modal/modal.component';
import { IcdModalService } from '../../../../core/services/icd-modal.service';

@Component({
  selector: 'app-icd-search-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal 
      [isOpen]="true" 
      [title]="'Buscador Global CIE-11'" 
      (close)="onClose()">
      
      <div class="space-y-6">
        <!-- Search Input -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-slate-400 group-focus-within:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            [formControl]="searchControl"
            class="w-full bg-slate-50 border-2 border-black px-12 py-4 text-sm font-black uppercase tracking-tight outline-none focus:bg-white transition-all placeholder:text-slate-300"
            placeholder="Escribe para buscar (ej: dermato, infarto...)"
            autoFocus
          >
          @if (isLoading()) {
            <div class="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div class="w-5 h-5 border-3 border-slate-200 border-t-black rounded-full animate-spin"></div>
            </div>
          }
        </div>

        <!-- Results Table -->
        <div class="border-2 border-black overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.05)]">
          <div class="bg-black text-white px-4 py-2 flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest">Resultados OMS</span>
            @if (results().length > 0) {
              <span class="text-[9px] font-bold text-slate-400">{{ results().length }} coincidencias</span>
            }
          </div>

          <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
            @if (results().length > 0) {
              <table class="w-full text-left border-collapse">
                <thead class="sticky top-0 bg-slate-50 border-b-2 border-black z-10">
                  <tr>
                    <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Cód</th>
                    <th class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Descripción</th>
                    <th class="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (res of results(); track res.code) {
                    <tr class="hover:bg-cyan-50 transition-colors group">
                      <td class="px-4 py-4">
                        <span class="px-2 py-1 bg-slate-100 border border-black text-[10px] font-black italic">{{ res.code }}</span>
                      </td>
                      <td class="px-4 py-4">
                        <div class="flex flex-col">
                          <span class="text-xs font-black uppercase leading-tight">{{ res.description }}</span>
                          @if (res.score) {
                            <span class="text-[8px] font-bold text-slate-400">Relevancia: {{ res.score.toFixed(2) }}</span>
                          }
                        </div>
                      </td>
                      <td class="px-4 py-4 text-right">
                        <button 
                          (click)="selectDiagnosis(res)"
                          class="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none"
                        >
                          + Agregar
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else if (!isLoading() && (searchControl.value?.length || 0) >= 3) {
              <div class="p-12 text-center space-y-4">
                <div class="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center mx-auto">
                    <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div>
                   <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sin resultados</p>
                   <p class="text-[9px] font-bold text-slate-300 italic">No se encontraron diagnósticos para "{{ searchControl.value || '' }}"</p>
                </div>
              </div>
            } @else {
              <div class="p-12 text-center text-slate-300">
                <p class="text-[10px] font-black uppercase tracking-[0.2em]">Esperando búsqueda...</p>
                <p class="text-[9px] font-bold italic">(Mínimo 3 caracteres)</p>
              </div>
            }
          </div>
        </div>
      </div>
      
      <!-- Footer Info -->
      <div class="mt-8 pt-6 border-t font-['Inter']">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-cyan-50 flex items-center justify-center border border-cyan-200">
                <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <p class="text-[9px] text-slate-500 font-medium">
                Esta herramienta consulta la base de datos oficial de la <strong class="text-black">Organización Mundial de la Salud (OMS)</strong> en tiempo real.
            </p>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IcdSearchModalComponent {
  private readonly icdService = inject(IcdService);
  private readonly modalService = inject(IcdModalService);

  searchControl = new FormControl('');
  results = signal<IcdDiagnosis[]>([]);
  isLoading = signal(false);

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.results.set([])),
      filter(query => !!query && query.length >= 3),
      tap(() => this.isLoading.set(true)),
      switchMap(query => this.icdService.searchDiagnoses(query!))
    ).subscribe({
      next: (res) => {
        this.results.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.results.set([]);
      }
    });
  }

  selectDiagnosis(diag: IcdDiagnosis): void {
    this.modalService.select(diag);
  }

  onClose(): void {
    this.modalService.close();
  }
}

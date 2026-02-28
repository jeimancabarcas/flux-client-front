import { Component, signal, inject, output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CumsService, CumMedication } from '../../../../core/services/cums.service';
import { Medication } from '../../../../core/models/rda.model';
import { debounceTime, distinctUntilChanged, switchMap, finalize, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
    selector: 'app-medication-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-6" [class.opacity-80]="isReadOnly">
        @if (!isReadOnly) {
            <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ label }}</label>
                <div class="relative group">
                    <input 
                        type="text" 
                        [value]="searchTerm()" 
                        (input)="onSearchInput($event)"
                        placeholder="Buscar por nombre, principio activo o código ATC..."
                        class="w-full p-4 pr-12 border-2 border-black outline-none focus:border-cyan-500 transition-all font-medium text-sm bg-white"
                        autocomplete="off"
                    >
                    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500">
                        @if (isSearching()) {
                            <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        } @else {
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    </div>

                    <!-- Dropdown Search Results -->
                    @if (searchResults().length > 0 && searchTerm().length >= 3) {
                        <div class="absolute left-0 right-0 top-full mt-2 bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.1)] z-[99999] max-h-[400px] overflow-y-auto block">
                            <div class="sticky top-0 bg-slate-50 border-b border-black p-2 text-[8px] font-black uppercase tracking-tighter text-slate-400 flex justify-between">
                                <span>Resultados encontrados: {{ searchResults().length }}</span>
                                <span class="text-cyan-600">Haga clic para seleccionar</span>
                            </div>
                            @for (med of searchResults(); track $index) {
                                <div 
                                    (click)="selectMedication(med)"
                                    class="p-4 hover:bg-cyan-50 border-b border-slate-100 last:border-0 cursor-pointer group transition-colors"
                                >
                                    <div class="flex justify-between items-start gap-4">
                                        <div class="flex-1">
                                            <h5 class="font-black text-xs uppercase group-hover:text-cyan-600 transition-colors leading-tight">{{ med.producto }}</h5>
                                            <p class="text-[9px] text-slate-600 font-bold mt-1 uppercase">
                                                {{ med.descripcionComercial }}
                                            </p>
                                            <p class="text-[9px] text-slate-500 font-medium mt-0.5">
                                                {{ med.principioActivo }} - {{ med.concentracion }}
                                            </p>
                                            <div class="flex gap-2 mt-2">
                                                <span class="px-1.5 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-400 border border-slate-200 uppercase tracking-tighter">ATC: {{ med.atc }}</span>
                                                <span class="px-1.5 py-0.5 bg-cyan-50 text-[8px] font-bold text-cyan-600 border border-cyan-100 uppercase tracking-tighter">{{ med.viaAdministracion }}</span>
                                                <span class="px-1.5 py-0.5 bg-emerald-50 text-[8px] font-bold text-emerald-600 border border-emerald-100 uppercase tracking-tighter">{{ med.formaFarmaceutica }}</span>
                                            </div>
                                        </div>
                                        <div class="text-right shrink-0">
                                            <span class="text-[9px] font-black text-slate-300 uppercase leading-none">CUMS: {{ med.expediente }}</span>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    } @else if (searchTerm().length >= 3 && !isSearching() && searchResults().length === 0) {
                        <div class="absolute left-0 right-0 top-full mt-2 bg-white border-2 border-black p-6 text-[10px] font-black text-slate-400 uppercase text-center shadow-[16px_16px_0px_rgba(0,0,0,0.1)] z-[99999] block">
                            No se encontraron medicamentos para "{{ searchTerm() }}"
                        </div>
                    } @else if (isSearching()) {
                        <div class="absolute left-0 right-0 top-full mt-2 bg-white border-2 border-black p-6 text-[10px] font-black text-cyan-600 uppercase text-center shadow-[16px_16px_0px_rgba(6,182,212,0.1)] z-[99999] block">
                            <div class="flex items-center justify-center gap-2">
                                <div class="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                Buscando medicamentos...
                            </div>
                        </div>
                    }
                </div>
            </div>
        }

        <!-- Selected Medications Table -->
        @if (selectedMedications.length > 0) {
            <div class="border-2 border-black animate-enter">
                <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-black text-white uppercase text-[9px] font-black tracking-widest">
                        <tr>
                            <th class="p-3 border-r border-white/20">Medicamento</th>
                            <th class="p-3 border-r border-white/20">Dosis</th>
                            <th class="p-3 border-r border-white/20">Frecuencia</th>
                            <th class="p-3 border-r border-white/20">Duración</th>
                            <th class="p-3">Instrucciones</th>
                            <th class="p-3 text-center w-12"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-black/10">
                        @for (med of selectedMedications; track $index) {
                            <tr class="group hover:bg-cyan-50/30 transition-colors">
                                <td class="p-3 border-r border-black/10">
                                    <div class="flex flex-col">
                                        <span class="font-black uppercase line-clamp-1">{{ med.name }}</span>
                                        <span class="text-[8px] font-bold text-slate-400 italic">CUMS: {{ med.cum }}</span>
                                    </div>
                                </td>
                                <td class="p-3 border-r border-black/10">
                                    <input 
                                        type="text" 
                                        [(ngModel)]="med.dosage" 
                                        (ngModelChange)="onMedicationChange()"
                                        [disabled]="isReadOnly"
                                        placeholder="Ej: 500mg"
                                        class="w-full bg-transparent outline-none font-bold text-cyan-600 placeholder:text-slate-300 placeholder:font-normal disabled:text-slate-600"
                                    >
                                </td>
                                <td class="p-3 border-r border-black/10">
                                    <input 
                                        type="text" 
                                        [(ngModel)]="med.frequency" 
                                        (ngModelChange)="onMedicationChange()"
                                        [disabled]="isReadOnly"
                                        placeholder="Ej: cada 8h"
                                        class="w-full bg-transparent outline-none font-bold text-cyan-600 placeholder:text-slate-300 placeholder:font-normal disabled:text-slate-600"
                                    >
                                </td>
                                <td class="p-3 border-r border-black/10">
                                    <input 
                                        type="text" 
                                        [(ngModel)]="med.duration" 
                                        (ngModelChange)="onMedicationChange()"
                                        [disabled]="isReadOnly"
                                        placeholder="Ej: 7 días"
                                        class="w-full bg-transparent outline-none font-bold text-cyan-600 placeholder:text-slate-300 placeholder:font-normal disabled:text-slate-600"
                                    >
                                </td>
                                <td class="p-3 border-r border-black/10">
                                    <textarea 
                                        [(ngModel)]="med.instructions" 
                                        (ngModelChange)="onMedicationChange()"
                                        [disabled]="isReadOnly"
                                        placeholder="Indicaciones adicionales..."
                                        rows="1"
                                        class="w-full bg-transparent outline-none font-medium text-[11px] resize-none overflow-hidden placeholder:text-slate-300 disabled:text-slate-500"
                                    ></textarea>
                                </td>
                                @if (!isReadOnly) {
                                    <td class="p-3 text-center">
                                        <button 
                                            (click)="removeMedication($index)"
                                            class="p-1 hover:text-red-500 transition-colors group-hover:scale-110"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                }
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        }
    </div>
    `,
    styles: [`
        :host { display: block; }
        .animate-enter {
            animation: enter 0.3s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @keyframes enter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `]
})
export class MedicationSelectorComponent {
    private readonly cumsService = inject(CumsService);

    @Input() label: string = 'Recetario de Medicamentos (CUMS)';
    @Input() isReadOnly: boolean = false;
    @Input() set initialSelection(value: Medication[]) {
        if (value && value.length > 0) {
            this.selectedMedications = [...value];
        }
    }

    selectionChange = output<Medication[]>();

    protected searchTerm = signal('');
    protected searchResults = signal<CumMedication[]>([]);
    protected isSearching = signal(false);
    protected selectedMedications: Medication[] = [];

    private searchSubject = new Subject<string>();

    constructor() {
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (term.length < 3) return of({ success: true, data: [] });
                this.isSearching.set(true);
                return this.cumsService.search(term).pipe(
                    catchError(err => {
                        console.error('Error buscando medicamentos:', err);
                        return of({ success: true, data: [] });
                    }),
                    finalize(() => this.isSearching.set(false))
                )
            })
        ).subscribe(res => {
            console.log('Respuesta búsqueda CUMS:', res);
            if (res.success) {
                this.searchResults.set(res.data);
            }
        });
    }

    onSearchInput(event: any): void {
        const input = event.target as HTMLInputElement;
        const term = input.value;
        console.log('MedicationSelector: input event, term:', term);
        this.searchTerm.set(term);
        this.searchSubject.next(term);
    }

    selectMedication(med: CumMedication): void {
        const medication: Medication = {
            cum: `${med.expediente}`,
            name: med.producto,
            dosage: '',
            frequency: '',
            duration: '',
            instructions: ''
        };

        this.selectedMedications.push(medication);
        this.searchTerm.set('');
        this.searchResults.set([]);
        this.onMedicationChange();
    }

    removeMedication(index: number): void {
        this.selectedMedications.splice(index, 1);
        this.onMedicationChange();
    }

    onMedicationChange(): void {
        this.selectionChange.emit([...this.selectedMedications]);
    }
}

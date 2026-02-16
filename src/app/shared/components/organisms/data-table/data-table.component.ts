import { Component, input, output, ContentChild, TemplateRef, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * DataTableComponent
 * A reusable, paginated table component following the Flux Medical design system.
 */
@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="overflow-hidden border border-black bg-white shadow-sm animate-enter">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 border-b border-black">
                    <tr>
                        @for (header of headers(); track header) {
                            <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                {{ header }}
                            </th>
                        }
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @if (isLoading()) {
                        @for (i of [1,2,3,4,5]; track i) {
                            <tr class="animate-pulse">
                                @for (h of headers(); track h) {
                                    <td class="px-4 py-4"><div class="h-4 bg-slate-100 rounded w-full"></div></td>
                                }
                            </tr>
                        }
                    } @else {
                        @for (item of data(); track trackByFn(item)) {
                            <tr class="hover:bg-slate-50 transition-colors align-top">
                                <ng-container 
                                    [ngTemplateOutlet]="rowTemplate || defaultRow" 
                                    [ngTemplateOutletContext]="{ $implicit: item }">
                                </ng-container>
                            </tr>
                        } @empty {
                            <tr>
                                <td [attr.colspan]="headers().length" class="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                    {{ emptyMessage() }}
                                </td>
                            </tr>
                        }
                    }
                </tbody>
            </table>
        </div>

        <!-- Pagination Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 py-4 bg-slate-50/50 border-t-2 border-black">
            <div class="flex items-center gap-8">
                @if (showTotal()) {
                    <div class="flex flex-col gap-1">
                        <span class="inline-block bg-black text-white text-[8px] font-black uppercase px-2 py-0.5 tracking-[0.2em] w-fit">
                            Total Registros
                        </span>
                        <span class="text-[11px] font-black text-black ml-1">{{ totalItems() }}</span>
                    </div>
                }
                
                @if (showLimit()) {
                    <div class="flex flex-col gap-1">
                        <span class="text-[8px] font-black uppercase text-slate-400 tracking-widest">Mostrar</span>
                        <select 
                            [ngModel]="limit()" 
                            (ngModelChange)="onLimitChange($event)"
                            class="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer border-b-2 border-black py-0.5 appearance-none pr-6 relative"
                            style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right center;">
                            @for (opt of limitOptions(); track opt) {
                                <option [value]="opt">{{ opt }} Filas</option>
                            }
                        </select>
                    </div>
                } @else if (showRecordsInfo()) {
                    <div class="flex flex-col gap-1">
                        <span class="text-[8px] font-black uppercase text-slate-400 tracking-widest">Registros</span>
                        <span class="text-[10px] font-black uppercase text-black italic">
                            {{ data().length }} Visibles
                        </span>
                    </div>
                }
            </div>

            <div class="flex flex-1 items-center justify-center text-center">
                @if (totalPages() && showRecordsInfo()) {
                    <span class="hidden md:inline-block text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-transparent">
                        TOTAL: {{ totalPages() }} PÁGINAS
                    </span>
                }
            </div>

            <div class="flex items-center gap-2">
                <button 
                    (click)="onPageChange(page() - 1)"
                    [disabled]="page() === 1 || isLoading()"
                    class="p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div class="px-4 py-2 bg-black text-white text-[10px] font-black min-w-[36px] text-center border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                    {{ page() }}
                </div>

                <button 
                    (click)="onPageChange(page() + 1)"
                    [disabled]="isNextDisabled() || isLoading()"
                    class="p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Default template if none provided -->
    <ng-template #defaultRow let-item>
        <td [attr.colspan]="headers().length" class="px-4 py-4 text-[10px] text-slate-600">
            {{ item | json }}
        </td>
    </ng-template>
    `,
    styles: [`
        .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #000000;
        }
        .animate-enter {
            animation: swissFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes swissFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent {
    // Inputs
    headers = input.required<string[]>();
    data = input.required<any[]>();
    isLoading = input(false);
    emptyMessage = input('Sin registros para mostrar.');

    // Pagination Inputs
    page = input(1);
    limit = input(5);
    totalItems = input(0);
    totalPages = input<number | null>(null);
    hasMore = input<boolean | null>(null);

    // UI Options
    showTotal = input(false);
    showLimit = input(false);
    showRecordsInfo = input(true);
    limitOptions = input([5, 10, 20, 50]);

    // Outputs
    pageChange = output<number>();
    limitChange = output<number>();

    // Row Template
    @ContentChild('rowTemplate') rowTemplate?: TemplateRef<any>;

    protected isNextDisabled = computed(() => {
        if (this.totalPages() !== null) {
            return this.page() >= (this.totalPages() || 1);
        }
        if (this.hasMore() !== null) {
            return !this.hasMore();
        }
        return this.data().length < this.limit();
    });

    protected onPageChange(newPage: number): void {
        if (newPage >= 1) {
            this.pageChange.emit(newPage);
        }
    }

    protected onLimitChange(newLimit: any): void {
        this.limitChange.emit(Number(newLimit));
    }

    protected trackByFn(item: any): any {
        return item.id || JSON.stringify(item);
    }
}

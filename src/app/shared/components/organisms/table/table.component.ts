import { Component, input, ContentChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SwissTableComponent
 * Organismo diseñado bajo los principios de Swiss Brutalism para la visualización de datos.
 * Ofrece consistencia visual en bordes, tipografía y estados de carga/vacío.
 */
@Component({
    selector: 'app-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="border-[2px] border-black bg-white overflow-hidden shadow-[10px_10px_0px_rgba(241,245,249,1)] animate-enter" style="--index: 2">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="border-b-[2px] border-black bg-slate-50">
              @for (header of headers(); track header) {
                <th class="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-100 last:border-r-0">
                  {{ header }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td [attr.colspan]="headers().length" class="p-20 text-center">
                  <div class="flex flex-col items-center gap-4">
                    <div class="w-10 h-10 border-4 border-black border-t-transparent animate-spin"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-600">Procesando Datos...</span>
                  </div>
                </td>
              </tr>
            } @else if (data().length === 0) {
              <tr>
                <td [attr.colspan]="headers().length" class="p-20 text-center">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    {{ emptyMessage() }}
                  </span>
                </td>
              </tr>
            } @else {
              @for (item of data(); track trackByFn(item)) {
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <ng-container 
                    [ngTemplateOutlet]="rowTemplate || defaultRow" 
                    [ngTemplateOutletContext]="{ $implicit: item }">
                  </ng-container>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Default view if no template provided -->
    <ng-template #defaultRow let-item>
      <td class="p-6 text-xs text-slate-600" [attr.colspan]="headers().length">
        {{ item | json }}
      </td>
    </ng-template>
  `,
    styles: [`
    :host { display: block; }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #000000;
    }

    @keyframes swissFadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-enter {
      opacity: 0;
      animation: swissFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent {
    headers = input.required<string[]>();
    data = input.required<any[]>();
    loading = input<boolean>(false);
    emptyMessage = input<string>('No se detectaron registros en el sistema.');

    // Custom row template
    @ContentChild('rowTemplate') rowTemplate?: TemplateRef<any>;

    protected trackByFn(item: any): any {
        return item.id || item;
    }
}

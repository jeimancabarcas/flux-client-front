import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          (click)="onClose()"
        ></div>
        
        <!-- Modal Container (Swiss Precision) -->
        <div 
          class="relative bg-white border-[3px] border-black w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-modal-enter shadow-[20px_20px_0px_rgba(0,0,0,0.1)]"
          (click)="$event.stopPropagation()"
        >
          <!-- Header (Sticky) -->
          <div class="flex-shrink-0 border-b-[2px] border-black p-6 flex items-center justify-between bg-white z-10">
            <h3 class="text-xs font-black uppercase tracking-[0.4em] text-black italic">{{ title() }}</h3>
            <button (click)="onClose()" class="text-slate-400 hover:text-black transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body (Scrollable) -->
          <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <ng-content />
          </div>

          <!-- Footer (Sticky / Optional) -->
          <div class="flex-shrink-0 p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-1">
             <div class="w-1 h-3 bg-slate-200"></div>
             <div class="w-1 h-3 bg-slate-300"></div>
             <div class="w-1 h-3 bg-slate-400"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalEnter {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
    .animate-modal-enter { animation: modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #000000;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Protocolo / Registro');
  close = output<void>();

  onClose() {
    this.close.emit();
  }
}

import { Component, input, ChangeDetectionStrategy } from '@angular/core';

type LogoSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-logo',
    imports: [],
    template: `
    <div class="text-center">
      <div [class]="containerClasses()">
        <svg class="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      
      @if (showTitle()) {
        <h1 [class]="titleClasses()">{{ title() }}</h1>
      }
      
      @if (showSubtitle() && subtitle()) {
        <p [class]="subtitleClasses()">{{ subtitle() }}</p>
      }
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent {
    size = input<LogoSize>('md');
    title = input<string>('Flux Medical');
    subtitle = input<string>('Sistema de Gestión de Consultorios Médicos');
    showTitle = input<boolean>(true);
    showSubtitle = input<boolean>(true);

    protected containerClasses(): string {
        const baseClasses = 'inline-flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg';

        const sizeClasses: Record<LogoSize, string> = {
            sm: 'w-12 h-12 mb-3',
            md: 'w-16 h-16 mb-4',
            lg: 'w-20 h-20 mb-6'
        };

        return `${baseClasses} ${sizeClasses[this.size()]}`;
    }

    protected titleClasses(): string {
        const sizeClasses: Record<LogoSize, string> = {
            sm: 'text-2xl mb-1',
            md: 'text-3xl mb-2',
            lg: 'text-4xl mb-3'
        };

        return `font-bold text-gray-900 ${sizeClasses[this.size()]}`;
    }

    protected subtitleClasses(): string {
        const sizeClasses: Record<LogoSize, string> = {
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg'
        };

        return `text-gray-600 ${sizeClasses[this.size()]}`;
    }
}

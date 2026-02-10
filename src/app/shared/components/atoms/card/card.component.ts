import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
        [class]="cardClasses()"
        (click)="interactive() && $event.stopPropagation()"
    >
        <ng-content></ng-content>
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
    customClass = input<string>('p-8');
    interactive = input<boolean>(false);

    protected cardClasses = computed(() => {
        let classes = `flex flex-col w-full border-2 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all ${this.customClass()}`;

        if (this.interactive()) {
            classes += ' cursor-pointer hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';
        }

        return classes;
    });
}

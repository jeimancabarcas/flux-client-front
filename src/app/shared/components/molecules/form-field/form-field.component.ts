import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { InputComponent } from '../../atoms/input/input.component';

@Component({
    selector: 'app-form-field',
    imports: [InputComponent],
    template: `
    <div>
      <label [for]="id()" class="block text-sm font-medium text-gray-700 mb-2">
        {{ label() }}
        @if (required()) {
          <span class="text-red-500">*</span>
        }
      </label>
      
      <app-input
        [id]="id()"
        [type]="type()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [hasError]="hasError()"
        [autocomplete]="autocomplete()"
        (valueChange)="valueChange.emit($event)"
        (blurred)="blurred.emit()"
        (focused)="focused.emit()"
      />
      
      @if (hasError() && errorMessage()) {
        <p [id]="id() + '-error'" class="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ errorMessage() }}
        </p>
      }
      
      @if (hint() && !hasError()) {
        <p class="mt-2 text-sm text-gray-500">{{ hint() }}</p>
      }
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent {
    id = input.required<string>();
    label = input.required<string>();
    type = input<'text' | 'email' | 'password' | 'number' | 'tel'>('text');
    value = input<string>('');
    placeholder = input<string>('');
    disabled = input<boolean>(false);
    required = input<boolean>(false);
    hasError = input<boolean>(false);
    errorMessage = input<string>('');
    hint = input<string>('');
    autocomplete = input<string>('off');

    valueChange = output<string>();
    blurred = output<void>();
    focused = output<void>();
}

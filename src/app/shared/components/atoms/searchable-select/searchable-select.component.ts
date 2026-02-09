import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchableOption {
    value: string;
    label: string;
    sublabel?: string;
}

@Component({
    selector: 'app-searchable-select',
    imports: [CommonModule],
    templateUrl: './searchable-select.component.html',
    styleUrl: './searchable-select.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: SearchableSelectComponent,
            multi: true
        }
    ]
})
export class SearchableSelectComponent implements ControlValueAccessor {
    // Inputs
    readonly options = input<SearchableOption[]>([]);
    readonly placeholder = input<string>('Buscar...');
    readonly label = input<string>('');
    readonly loading = input<boolean>(false);
    readonly emptyMessage = input<string>('No se encontraron resultados');

    // Outputs
    readonly searchChange = output<string>();

    // State
    protected readonly searchTerm = signal('');
    protected readonly isOpen = signal(false);
    protected readonly selectedValue = signal<string>('');

    // Computed
    protected readonly filteredOptions = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.options();

        return this.options().filter(opt =>
            opt.label.toLowerCase().includes(term) ||
            opt.sublabel?.toLowerCase().includes(term)
        );
    });

    protected readonly selectedLabel = computed(() => {
        const selected = this.options().find(opt => opt.value === this.selectedValue());
        return selected ? selected.label : '';
    });

    // ControlValueAccessor
    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(value: string): void {
        this.selectedValue.set(value || '');
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    // Methods
    protected onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchTerm.set(value);
        this.searchChange.emit(value);
    }

    protected selectOption(option: SearchableOption): void {
        this.selectedValue.set(option.value);
        this.onChange(option.value);
        this.onTouched();
        this.isOpen.set(false);
        this.searchTerm.set('');
    }

    protected toggleDropdown(): void {
        this.isOpen.update(v => !v);
        if (!this.isOpen()) {
            this.searchTerm.set('');
        }
    }

    protected closeDropdown(): void {
        this.isOpen.set(false);
        this.searchTerm.set('');
    }
}

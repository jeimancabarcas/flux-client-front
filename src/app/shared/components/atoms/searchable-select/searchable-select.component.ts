import { Component, input, output, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
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
    readonly value = input<string>(''); // Nuevo: para uso sin FormControl
    readonly compact = input<boolean>(false); // Nuevo: para versión reducida en filtros
    readonly multiple = input<boolean>(false); // Nuevo: para selección múltiple

    // Outputs
    readonly searchChange = output<string>();
    readonly selectionChange = output<string | string[]>(); // Actualizado: soporta array para multiselect

    // State
    protected readonly searchTerm = signal('');
    protected readonly isOpen = signal(false);
    protected readonly selectedValue = signal<string>('');
    protected readonly selectedValues = signal<string[]>([]);
    protected readonly isDisabled = signal<boolean>(false);

    constructor() {
        // Sincronizar el signal de valor cuando cambia el input 'value' (Modo Standalone)
        effect(() => {
            const externalValue = this.value();
            if (externalValue !== undefined) {
                if (this.multiple()) {
                    this.selectedValues.set(Array.isArray(externalValue) ? externalValue : [externalValue]);
                } else {
                    this.selectedValue.set(typeof externalValue === 'string' ? externalValue : '');
                }
            }
        });
    }

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
        if (this.multiple()) {
            const count = this.selectedValues().length;
            if (count === 0) return '';
            if (count === 1) {
                const selected = this.options().find(opt => opt.value === this.selectedValues()[0]);
                return selected ? selected.label : `${count} seleccionados`;
            }
            return `${count} ítems seleccionados`;
        }
        const selected = this.options().find(opt => opt.value === this.selectedValue());
        return selected ? selected.label : '';
    });

    // ControlValueAccessor
    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(value: any): void {
        if (this.multiple()) {
            this.selectedValues.set(Array.isArray(value) ? value : []);
        } else {
            this.selectedValue.set(value || '');
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
    }

    // Methods
    protected onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchTerm.set(value);
        this.searchChange.emit(value);
    }

    protected selectOption(option: SearchableOption): void {
        if (this.multiple()) {
            const current = this.selectedValues();
            const index = current.indexOf(option.value);
            let next: string[];
            if (index > -1) {
                next = current.filter(v => v !== option.value);
            } else {
                next = [...current, option.value];
            }
            this.selectedValues.set(next);
            this.onChange(next as any);
            this.selectionChange.emit(next);
        } else {
            this.selectedValue.set(option.value);
            this.onChange(option.value);
            this.selectionChange.emit(option.value);
            this.isOpen.set(false);
            this.searchTerm.set('');
        }
        this.onTouched();
    }

    protected isSelected(value: string): boolean {
        if (this.multiple()) {
            return this.selectedValues().includes(value);
        }
        return this.selectedValue() === value;
    }

    protected toggleDropdown(): void {
        if (this.isDisabled()) return;
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

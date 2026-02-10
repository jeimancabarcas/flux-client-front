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

    // Outputs
    readonly searchChange = output<string>();
    readonly selectionChange = output<string>(); // Nuevo: para emitir cambios en modo standalone

    // State
    protected readonly searchTerm = signal('');
    protected readonly isOpen = signal(false);
    protected readonly selectedValue = signal<string>('');
    protected readonly isDisabled = signal<boolean>(false);

    constructor() {
        // Sincronizar el signal de valor cuando cambia el input 'value' (Modo Standalone)
        effect(() => {
            const externalValue = this.value();
            if (externalValue !== undefined) {
                this.selectedValue.set(externalValue);
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
        this.selectedValue.set(option.value);
        this.onChange(option.value);
        this.onTouched();
        this.selectionChange.emit(option.value); // Emitir para modo standalone
        this.isOpen.set(false);
        this.searchTerm.set('');
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

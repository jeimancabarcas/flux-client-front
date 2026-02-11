import { Component, EventEmitter, input, output, Signal, computed, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../../core/models/appointment.model';
import { CatalogItem, Agreement, Prepagada } from '../../../../core/models/masters.model';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { MastersService } from '../../../../core/services/masters.service';
import { SearchableSelectComponent, SearchableOption } from '../../../../shared/components/atoms/searchable-select/searchable-select.component';

@Component({
    selector: 'app-check-in-drawer',
    imports: [CommonModule, FormsModule, SearchableSelectComponent],
    templateUrl: './check-in-drawer.component.html',
    styleUrl: './check-in-drawer.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckInDrawerComponent {
    // Inputs
    isOpen = input<boolean>(false);
    appointment = input<Appointment | null>(null);
    catalogItems = input<CatalogItem[]>([]);

    // Outputs
    close = output<void>();
    process = output<void>();

    private readonly appointmentService = inject(AppointmentService);
    private readonly mastersService = inject(MastersService);

    protected readonly isLoading = signal(false);
    protected readonly selectedItemIds = signal<Set<string>>(new Set());

    // New State for Billing Logic
    protected readonly paymentType = signal<'PARTICULAR' | 'CONVENIO'>('PARTICULAR');
    protected readonly selectedPrepagadaId = signal<string>('');
    protected readonly authorizationCode = signal<string>('');
    protected readonly agreements = signal<Agreement[]>([]);
    protected readonly prepagadas = signal<Prepagada[]>([]);

    // Effect to initialize selection when drawer opens
    constructor() {
        effect(() => {
            const open = this.isOpen();
            const app = this.appointment();
            if (open && app) {
                const newSet = new Set<string>();
                // Prioritize items objects if available, otherwise use itemIds
                if (app.items && app.items.length > 0) {
                    app.items.forEach(item => newSet.add(item.id));
                } else if (app.itemIds) {
                    app.itemIds.forEach(id => newSet.add(id));
                }
                this.selectedItemIds.set(newSet);
                this.loadPrepagadas();
                this.paymentType.set('PARTICULAR');
                this.selectedPrepagadaId.set('');
                this.authorizationCode.set('');
            }
        }, { allowSignalWrites: true });

        // Effect to load agreements when prepagada or items change
        effect(() => {
            const prepagadaId = this.selectedPrepagadaId();
            if (prepagadaId) {
                this.mastersService.getAgreements(prepagadaId, true).subscribe(res => {
                    if (res.success) this.agreements.set(res.data);
                });
            } else {
                this.agreements.set([]);
            }
        }, { allowSignalWrites: true });
    }

    private loadPrepagadas(): void {
        this.mastersService.getPrepagadaList().subscribe(res => {
            if (res.success) this.prepagadas.set(res.data);
        });
    }

    // Derived state
    protected readonly catalogOptions = computed<SearchableOption[]>(() =>
        this.catalogItems().map(item => ({
            value: item.id,
            label: item.name,
            sublabel: `${item.code} - ${item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`
        }))
    );

    protected readonly mappedItems = computed(() => {
        const selectedIds = this.selectedItemIds();
        const catalog = this.catalogItems();
        // Filter catalog to show only currently selected items in the list
        return catalog.filter(item => selectedIds.has(item.id));
    });

    protected readonly patientPayAmount = computed(() => {
        const selectedIds = this.selectedItemIds();
        const catalog = this.catalogItems();
        const type = this.paymentType();
        const agreementList = this.agreements();

        if (type === 'PARTICULAR') {
            return catalog
                .filter(item => selectedIds.has(item.id))
                .reduce((sum, item) => sum + item.price, 0);
        } else {
            return catalog
                .filter(item => selectedIds.has(item.id))
                .reduce((sum, item) => {
                    const agreement = agreementList.find(a => a.productServiceId === item.id);
                    return sum + (agreement ? agreement.patientAmount : item.price);
                }, 0);
        }
    });

    protected readonly entityPayAmount = computed(() => {
        const selectedIds = this.selectedItemIds();
        const catalog = this.catalogItems();
        const type = this.paymentType();
        const agreementList = this.agreements();

        if (type === 'PARTICULAR') return 0;

        return catalog
            .filter(item => selectedIds.has(item.id))
            .reduce((sum, item) => {
                const agreement = agreementList.find(a => a.productServiceId === item.id);
                return sum + (agreement ? agreement.entityAmount : 0);
            }, 0);
    });

    protected readonly totalOriginalAmount = computed(() => {
        const selectedIds = this.selectedItemIds();
        const catalog = this.catalogItems();
        return catalog
            .filter(item => selectedIds.has(item.id))
            .reduce((sum, item) => sum + item.price, 0);
    });

    protected toggleItem(id: string): void {
        const currentSet = new Set(this.selectedItemIds());
        if (currentSet.has(id)) {
            currentSet.delete(id);
        } else {
            currentSet.add(id);
        }
        this.selectedItemIds.set(currentSet);
    }

    protected addItem(id: string): void {
        if (!id) return;
        const currentSet = new Set(this.selectedItemIds());
        currentSet.add(id);
        this.selectedItemIds.set(currentSet);
    }

    protected getAgreementForItem(itemId: string): Agreement | undefined {
        return this.agreements().find(a => a.productServiceId === itemId);
    }

    protected getSelectedPrepagadaName(): string {
        const id = this.selectedPrepagadaId();
        if (!id) return '';
        return this.prepagadas().find(p => p.id === id)?.name || '';
    }

    protected confirmAndBill(): void {
        const app = this.appointment();
        if (!app) return;

        this.isLoading.set(true);
        const itemsToBill = Array.from(this.selectedItemIds());

        // Prepare metadata for billing if convenio
        const billingData = {
            paymentType: this.paymentType(),
            prepagadaId: this.selectedPrepagadaId(),
            authorizationCode: this.authorizationCode()
        };

        this.appointmentService.confirmAppointment(app.id, itemsToBill, billingData).subscribe({
            next: (res) => {
                if (res.success) {
                    this.process.emit();
                    this.close.emit();
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }
}

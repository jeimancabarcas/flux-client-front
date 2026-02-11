import { Component, EventEmitter, input, output, Signal, computed, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../../core/models/appointment.model';
import { CatalogItem } from '../../../../core/models/masters.model';
import { AppointmentService } from '../../../../core/services/appointment.service';

@Component({
    selector: 'app-check-in-drawer',
    imports: [CommonModule, FormsModule],
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

    protected readonly isLoading = signal(false);
    protected readonly selectedItemIds = signal<Set<string>>(new Set());

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
            }
        });
    }

    // Derived state
    protected readonly mappedItems = computed(() => {
        const app = this.appointment();
        const catalog = this.catalogItems();
        if (!app) return [];

        // If backend already sent full objects, use them
        if (app.items && app.items.length > 0) {
            return app.items;
        }

        // Otherwise filter from full catalog using IDs
        if (!app.itemIds) return [];
        return catalog.filter(item => app.itemIds!.includes(item.id));
    });

    protected readonly totalAmount = computed(() => {
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

    protected confirmAndBill(): void {
        const app = this.appointment();
        if (!app) return;

        this.isLoading.set(true);
        const itemsToBill = Array.from(this.selectedItemIds());

        this.appointmentService.confirmAppointment(app.id, itemsToBill).subscribe({
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

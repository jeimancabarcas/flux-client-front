import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MastersService } from '../../../../core/services/masters.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CatalogItem } from '../../../../core/models/masters.model';
import { SidebarComponent } from '../../../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../../../shared/components/molecules/modal/modal.component';
import { TableComponent } from '../../../../shared/components/organisms/table/table.component';
import { CatalogFormComponent } from '../../../../shared/components/organisms/catalog-form/catalog-form.component';

@Component({
    selector: 'app-catalog-management',
    standalone: true,
    imports: [CommonModule, SidebarComponent, ModalComponent, TableComponent, CatalogFormComponent],
    templateUrl: './catalog-management.component.html',
    styleUrl: './catalog-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogManagementComponent implements OnInit {
    private readonly mastersService = inject(MastersService);
    protected readonly authService = inject(AuthService);

    protected readonly catalogList = signal<CatalogItem[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);
    protected readonly searchTerm = signal('');

    // Modal signals
    protected readonly isFormModalOpen = signal(false);
    protected readonly isDeleteModalOpen = signal(false);
    protected readonly selectedItem = signal<CatalogItem | null>(null);
    protected readonly isProcessingAction = signal(false);

    // Filtered list
    protected readonly filteredCatalog = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.catalogList();

        return this.catalogList().filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.code.toLowerCase().includes(term)
        );
    });

    ngOnInit(): void {
        this.loadCatalog();
    }

    protected loadCatalog(): void {
        this.isLoading.set(true);
        this.mastersService.getCatalog().subscribe({
            next: (res) => {
                if (res.success) {
                    this.catalogList.set(res.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected onSearch(term: string): void {
        this.searchTerm.set(term);
    }

    protected openCreateModal(): void {
        this.selectedItem.set(null);
        this.isFormModalOpen.set(true);
    }

    protected openEditModal(item: CatalogItem): void {
        this.selectedItem.set(item);
        this.isFormModalOpen.set(true);
    }

    protected openDeleteModal(item: CatalogItem): void {
        this.selectedItem.set(item);
        this.isDeleteModalOpen.set(true);
    }

    protected closeModals(): void {
        this.isFormModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.selectedItem.set(null);
    }

    protected handleSubmit(formData: any): void {
        this.isProcessingAction.set(true);
        const item = this.selectedItem();

        const request$ = item
            ? this.mastersService.updateCatalogItem(item.id, formData)
            : this.mastersService.createCatalogItem(formData);

        request$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadCatalog();
                    this.closeModals();
                }
                this.isProcessingAction.set(false);
            },
            error: () => this.isProcessingAction.set(false)
        });
    }

    protected confirmDelete(): void {
        const item = this.selectedItem();
        if (!item) return;

        this.isProcessingAction.set(true);
        this.mastersService.deleteCatalogItem(item.id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadCatalog();
                    this.closeModals();
                }
                this.isProcessingAction.set(false);
            },
            error: () => this.isProcessingAction.set(false)
        });
    }

    protected toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }
}

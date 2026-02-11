import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MastersService } from '../../../../core/services/masters.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Agreement, CatalogItem, Prepagada } from '../../../../core/models/masters.model';
import { ApiResponse } from '../../../../core/models/user.model';
import { SidebarComponent } from '../../../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../../../shared/components/molecules/modal/modal.component';
import { AgreementFormComponent } from '../../../../shared/components/organisms/agreement-form/agreement-form.component';

@Component({
    selector: 'app-agreement-management',
    standalone: true,
    imports: [CommonModule, SidebarComponent, ModalComponent, AgreementFormComponent],
    templateUrl: './agreement-management.component.html',
    styleUrl: './agreement-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgreementManagementComponent implements OnInit {
    private readonly mastersService = inject(MastersService);
    protected readonly authService = inject(AuthService);

    protected readonly agreementList = signal<Agreement[]>([]);
    protected readonly catalogItems = signal<CatalogItem[]>([]);
    protected readonly prepagadaList = signal<Prepagada[]>([]);

    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);

    // Modal signals
    protected readonly isFormModalOpen = signal(false);
    protected readonly isDeleteModalOpen = signal(false);
    protected readonly selectedAgreement = signal<Agreement | null>(null);
    protected readonly isProcessingAction = signal(false);

    ngOnInit(): void {
        this.loadData();
    }

    protected loadData(): void {
        this.isLoading.set(true);

        // Cargar todo en paralelo
        this.mastersService.getPrepagadaList().subscribe((res: ApiResponse<Prepagada[]>) => {
            if (res.success) this.prepagadaList.set(res.data);
        });

        this.mastersService.getCatalog().subscribe((res: ApiResponse<CatalogItem[]>) => {
            if (res.success) this.catalogItems.set(res.data);
        });

        this.mastersService.getAgreements().subscribe({
            next: (res: ApiResponse<Agreement[]>) => {
                if (res.success) {
                    this.agreementList.set(res.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected getProductName(id: string): string {
        return this.catalogItems().find(c => c.id === id)?.name || 'Cargando...';
    }

    protected getPrepagadaName(id: string): string {
        return this.prepagadaList().find(p => p.id === id)?.name || 'Cargando...';
    }

    protected openCreateModal(): void {
        this.selectedAgreement.set(null);
        this.isFormModalOpen.set(true);
    }

    protected openEditModal(item: Agreement): void {
        this.selectedAgreement.set(item);
        this.isFormModalOpen.set(true);
    }

    protected openDeleteModal(item: Agreement): void {
        this.selectedAgreement.set(item);
        this.isDeleteModalOpen.set(true);
    }

    protected closeModals(): void {
        this.isFormModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.selectedAgreement.set(null);
    }

    protected handleSubmit(formData: any): void {
        this.isProcessingAction.set(true);
        const item = this.selectedAgreement();

        const request$ = item
            ? this.mastersService.updateAgreement(item.id, formData)
            : this.mastersService.createAgreement(formData);

        request$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadData();
                    this.closeModals();
                }
                this.isProcessingAction.set(false);
            },
            error: () => this.isProcessingAction.set(false)
        });
    }

    protected confirmDelete(): void {
        const item = this.selectedAgreement();
        if (!item) return;

        this.isProcessingAction.set(true);
        this.mastersService.deleteAgreement(item.id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.loadData();
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

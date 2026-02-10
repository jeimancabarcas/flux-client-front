import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MastersService } from '../../../core/services/masters.service';
import { AuthService } from '../../../core/services/auth.service';
import { Prepagada } from '../../../core/models/masters.model';
import { SidebarComponent } from '../../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../../shared/components/molecules/modal/modal.component';
import { TableComponent } from '../../../shared/components/organisms/table/table.component';
import { MasterFormComponent } from '../../../shared/components/organisms/master-form/master-form.component';

@Component({
    selector: 'app-prepagada-management',
    standalone: true,
    imports: [CommonModule, SidebarComponent, ModalComponent, TableComponent, MasterFormComponent],
    templateUrl: './prepagada-management.component.html',
    styleUrl: './prepagada-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrepagadaManagementComponent implements OnInit {
    private readonly mastersService = inject(MastersService);
    protected readonly authService = inject(AuthService);

    protected readonly prepagadaList = signal<Prepagada[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);

    // Modal signals
    protected readonly isFormModalOpen = signal(false);
    protected readonly isDeleteModalOpen = signal(false);
    protected readonly selectedPrepagada = signal<Prepagada | null>(null);
    protected readonly isProcessingAction = signal(false);

    ngOnInit(): void {
        this.loadPrepagadas();
    }

    protected loadPrepagadas(): void {
        this.isLoading.set(true);
        this.mastersService.getPrepagadaList().subscribe({
            next: (res) => {
                if (res.success) {
                    this.prepagadaList.set(res.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected openCreateModal(): void {
        this.selectedPrepagada.set(null);
        this.isFormModalOpen.set(true);
    }

    protected openEditModal(item: Prepagada): void {
        this.selectedPrepagada.set(item);
        this.isFormModalOpen.set(true);
    }

    protected openDeleteModal(item: Prepagada): void {
        this.selectedPrepagada.set(item);
        this.isDeleteModalOpen.set(true);
    }

    protected closeModals(): void {
        this.isFormModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.selectedPrepagada.set(null);
    }

    protected handleSubmit(formData: any): void {
        this.isProcessingAction.set(true);
        const item = this.selectedPrepagada();

        const request$ = item
            ? this.mastersService.updatePrepagada(item.id, formData)
            : this.mastersService.createPrepagada(formData);

        request$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadPrepagadas();
                    this.closeModals();
                }
                this.isProcessingAction.set(false);
            },
            error: () => this.isProcessingAction.set(false)
        });
    }

    protected confirmDelete(): void {
        const item = this.selectedPrepagada();
        if (!item) return;

        this.isProcessingAction.set(true);
        this.mastersService.deletePrepagada(item.id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadPrepagadas();
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

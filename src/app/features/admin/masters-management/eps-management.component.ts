import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MastersService } from '../../../core/services/masters.service';
import { AuthService } from '../../../core/services/auth.service';
import { Eps } from '../../../core/models/masters.model';
import { SidebarComponent } from '../../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../../shared/components/molecules/modal/modal.component';
import { TableComponent } from '../../../shared/components/organisms/table/table.component';
import { MasterFormComponent } from '../../../shared/components/organisms/master-form/master-form.component';

@Component({
    selector: 'app-eps-management',
    standalone: true,
    imports: [CommonModule, SidebarComponent, ModalComponent, TableComponent, MasterFormComponent],
    templateUrl: './eps-management.component.html',
    styleUrl: './eps-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpsManagementComponent implements OnInit {
    private readonly mastersService = inject(MastersService);
    protected readonly authService = inject(AuthService);

    protected readonly epsList = signal<Eps[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);

    // Modal signals
    protected readonly isFormModalOpen = signal(false);
    protected readonly isDeleteModalOpen = signal(false);
    protected readonly selectedEps = signal<Eps | null>(null);
    protected readonly isProcessingAction = signal(false);

    ngOnInit(): void {
        this.loadEps();
    }

    protected loadEps(): void {
        this.isLoading.set(true);
        this.mastersService.getEpsList().subscribe({
            next: (res) => {
                if (res.success) {
                    this.epsList.set(res.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected openCreateModal(): void {
        this.selectedEps.set(null);
        this.isFormModalOpen.set(true);
    }

    protected openEditModal(eps: Eps): void {
        this.selectedEps.set(eps);
        this.isFormModalOpen.set(true);
    }

    protected openDeleteModal(eps: Eps): void {
        this.selectedEps.set(eps);
        this.isDeleteModalOpen.set(true);
    }

    protected closeModals(): void {
        this.isFormModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.selectedEps.set(null);
    }

    protected handleSubmit(formData: any): void {
        this.isProcessingAction.set(true);
        const eps = this.selectedEps();

        const request$ = eps
            ? this.mastersService.updateEps(eps.id, formData)
            : this.mastersService.createEps(formData);

        request$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadEps();
                    this.closeModals();
                }
                this.isProcessingAction.set(false);
            },
            error: () => this.isProcessingAction.set(false)
        });
    }

    protected confirmDelete(): void {
        const eps = this.selectedEps();
        if (!eps) return;

        this.isProcessingAction.set(true);
        this.mastersService.deleteEps(eps.id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadEps();
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

import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpecialtyService } from '../../../core/services/specialty.service';
import { AuthService } from '../../../core/services/auth.service';
import { Specialty } from '../../../core/models/specialty.model';
import { SidebarComponent } from '../../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../../shared/components/molecules/modal/modal.component';
import { SpecialtyFormComponent } from '../../../shared/components/organisms/specialty-form/specialty-form.component';

@Component({
    selector: 'app-specialty-management',
    standalone: true,
    imports: [CommonModule, SidebarComponent, ModalComponent, SpecialtyFormComponent],
    templateUrl: './specialty-management.component.html',
    styleUrl: './specialty-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpecialtyManagementComponent implements OnInit {
    private readonly specialtyService = inject(SpecialtyService);
    protected readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly specialties = signal<Specialty[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);

    // Modal signals
    protected readonly isFormModalOpen = signal(false);
    protected readonly isDeleteModalOpen = signal(false);
    protected readonly selectedSpecialty = signal<Specialty | null>(null);
    protected readonly isProcessingAction = signal(false);

    ngOnInit(): void {
        this.loadSpecialties();
    }

    protected loadSpecialties(): void {
        this.isLoading.set(true);
        this.specialtyService.getSpecialties().subscribe({
            next: (response) => {
                if (response.success) {
                    this.specialties.set(response.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected openCreateModal(): void {
        this.selectedSpecialty.set(null);
        this.isFormModalOpen.set(true);
    }

    protected openEditModal(specialty: Specialty): void {
        this.selectedSpecialty.set(specialty);
        this.isFormModalOpen.set(true);
    }

    protected openDeleteModal(specialty: Specialty): void {
        this.selectedSpecialty.set(specialty);
        this.isDeleteModalOpen.set(true);
    }

    protected closeModals(): void {
        this.isFormModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.selectedSpecialty.set(null);
    }

    protected handleSpecialtySubmit(formData: any): void {
        this.isProcessingAction.set(true);
        const specialty = this.selectedSpecialty();

        const request$ = specialty
            ? this.specialtyService.updateSpecialty(specialty.id, formData)
            : this.specialtyService.createSpecialty(formData);

        request$.subscribe({
            next: (response) => {
                if (response.success) {
                    this.loadSpecialties();
                    this.closeModals();
                }
                this.isProcessingAction.set(false);
            },
            error: () => this.isProcessingAction.set(false)
        });
    }

    protected confirmDelete(): void {
        const specialty = this.selectedSpecialty();
        if (!specialty) return;

        this.isProcessingAction.set(true);
        this.specialtyService.deleteSpecialty(specialty.id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.loadSpecialties();
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

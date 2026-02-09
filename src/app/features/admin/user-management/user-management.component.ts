import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';
import { SidebarComponent } from '../../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../../shared/components/molecules/modal/modal.component';
import { UserFormComponent } from '../../../shared/components/organisms/user-form/user-form.component';
import { TableComponent } from '../../../shared/components/organisms/table/table.component';

@Component({
    selector: 'app-user-management',
    imports: [CommonModule, SidebarComponent, ModalComponent, UserFormComponent, TableComponent],
    templateUrl: './user-management.component.html',
    styleUrl: './user-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements OnInit {
    private readonly userService = inject(UserService);
    protected readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly UserRole = UserRole;
    protected readonly users = signal<User[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);

    // Modal signals
    protected readonly isFormModalOpen = signal(false);
    protected readonly isDeleteModalOpen = signal(false);
    protected readonly selectedUser = signal<User | null>(null);
    protected readonly isProcessingAction = signal(false);

    ngOnInit(): void {
        this.loadUsers();
    }

    protected loadUsers(): void {
        this.isLoading.set(true);
        this.userService.getUsers().subscribe({
            next: (response) => {
                if (response.success) {
                    this.users.set(response.data);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected openCreateModal(): void {
        this.selectedUser.set(null);
        this.isFormModalOpen.set(true);
    }

    protected openEditModal(user: User): void {
        this.selectedUser.set(user);
        this.isFormModalOpen.set(true);
    }

    protected openDeleteModal(user: User): void {
        this.selectedUser.set(user);
        this.isDeleteModalOpen.set(true);
    }

    protected closeModals(): void {
        this.isFormModalOpen.set(false);
        this.isDeleteModalOpen.set(false);
        this.selectedUser.set(null);
    }

    protected handleUserSubmit(formData: any): void {
        this.isProcessingAction.set(true);
        const user = this.selectedUser();

        const request$ = user
            ? this.userService.updateUser(user.id, formData)
            : this.userService.createUser(formData);

        request$.subscribe({
            next: (response) => {
                if (response.success) {
                    this.loadUsers();
                    this.closeModals();
                }
                this.isProcessingAction.set(false);
            },
            error: () => this.isProcessingAction.set(false)
        });
    }

    protected confirmDelete(): void {
        const user = this.selectedUser();
        if (!user) return;

        this.isProcessingAction.set(true);
        this.userService.deleteUser(user.id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.loadUsers();
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

    protected onLogout(): void {
        this.authService.logout();
    }
}

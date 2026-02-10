import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { SidebarComponent } from '../../shared/components/organisms/sidebar/sidebar.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models/appointment.model';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/atoms/card/card.component';
import { ModalComponent } from '../../shared/components/molecules/modal/modal.component';
import { AppointmentStatus } from '../../core/models/appointment.model';

@Component({
    selector: 'app-dashboard',
    imports: [SidebarComponent, CommonModule, CardComponent, ModalComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    protected readonly authService = inject(AuthService);
    protected readonly appointmentService = inject(AppointmentService);
    private readonly router = inject(Router);

    protected readonly isSidebarOpen = signal(false);
    protected readonly nextAppointments = signal<Appointment[]>([]);
    protected readonly activeConsultation = signal<Appointment | null>(null);
    protected readonly isLoadingAppointments = signal(false);
    protected readonly selectedStatus = signal<AppointmentStatus | 'TODOS'>('TODOS');
    protected readonly errorMessage = signal<string | null>(null);

    // Expose UserRole enum to template
    protected readonly UserRole = UserRole;

    protected readonly filteredAppointments = computed(() => {
        const status = this.selectedStatus();
        const appointments = this.nextAppointments();
        if (status === 'TODOS') return appointments;
        return appointments.filter(a => a.status === status);
    });

    ngOnInit(): void {
        if (this.authService.userRole() === UserRole.MEDICO) {
            this.loadNextAppointments();
            this.loadActiveConsultation();
        }
    }

    private loadActiveConsultation(): void {
        this.appointmentService.getActiveConsultation().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.activeConsultation.set(res.data);
                }
            }
        });
    }

    protected readonly sortOrder = signal<'ASC' | 'DESC'>('ASC');

    private loadNextAppointments(): void {
        this.isLoadingAppointments.set(true);
        // Generar inicio del día: 00:00:00.000 LOCAL convertido a ISO, como solicitaste
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

        this.appointmentService.getNextAppointments(startOfDay, this.sortOrder()).subscribe({

            next: (res) => {
                if (res.success && res.data) {
                    // Filtrar estrictamente por los estados solicitados: PENDIENTE, CONFIRMADA, COMPLETADA
                    const filtered = res.data.filter(app =>
                        [AppointmentStatus.PENDIENTE, AppointmentStatus.CONFIRMADA, AppointmentStatus.COMPLETADA].includes(app.status)
                    );
                    this.nextAppointments.set(filtered);
                }
                this.isLoadingAppointments.set(false);
            },
            error: () => this.isLoadingAppointments.set(false)
        });
    }

    protected toggleSortOrder(): void {
        this.sortOrder.update(o => o === 'ASC' ? 'DESC' : 'ASC');
        this.loadNextAppointments();
    }

    /**
     * Formatear hora para visualización
     */
    protected formatTime(isoString: string): string {
        const date = new Date(isoString);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Obtener el día relativo (Hoy, Mañana, o Fecha)
     */
    protected getRelativeDay(isoString: string): string {
        const date = new Date(isoString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'HOY';
        if (date.toDateString() === tomorrow.toDateString()) return 'MAÑANA';

        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
    }

    /**
     * Toggle sidebar for mobile
     */
    protected toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }

    /**
     * Navigate to users management (Admin only)
     */
    protected goToUsers(): void {
        this.router.navigate(['/admin/users']);
    }

    /**
     * Navigate to appointments
     */
    protected goToAppointments(): void {
        this.router.navigate(['/appointments']);
    }

    /**
     * Iniciar modo consulta para una cita específica
     */
    protected startConsultation(appointmentId: string): void {
        // Usar el signal activeConsultation como fuente de verdad primaria
        const currentActive = this.activeConsultation();

        // Si ya hay una consulta activa y NO es la que intentamos abrir, bloquear
        if (currentActive && currentActive.id !== appointmentId) {
            this.errorMessage.set('Debe terminar la consulta que tiene en curso primero.');
            return;
        }

        this.router.navigate(['/appointments', appointmentId, 'consultation']);
    }

    protected clearError(): void {
        this.errorMessage.set(null);
    }

    protected onLogout(): void {
        this.authService.logout();
    }
}

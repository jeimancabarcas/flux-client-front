import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { RdaService } from '../../../core/services/rda.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient } from '../../../core/models/patient.model';
import { Appointment } from '../../../core/models/appointment.model';
import { ClinicalRecordRDA } from '../../../core/models/rda.model';
import { UserRole } from '../../../core/models/user.model';
import { SidebarComponent } from '../../../shared/components/organisms/sidebar/sidebar.component';
import { CheckInDrawerComponent } from '../../appointments/components/check-in-drawer/check-in-drawer.component';
import { MastersService } from '../../../core/services/masters.service';
import { CatalogItem } from '../../../core/models/masters.model';

interface BillingRecord {
    id: string;
    date: string;
    concept: string;
    amount: number;
    status: 'PAGADO' | 'PENDIENTE' | 'ANULADO';
}

@Component({
    selector: 'app-patient-detail',
    imports: [CommonModule, FormsModule, SidebarComponent, CheckInDrawerComponent],
    templateUrl: './patient-detail.component.html',
    styleUrl: './patient-detail.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly patientService = inject(PatientService);
    private readonly appointmentService = inject(AppointmentService);
    private readonly rdaService = inject(RdaService);
    private readonly mastersService = inject(MastersService);
    protected readonly authService = inject(AuthService);

    // State
    protected readonly patient = signal<Patient | null>(null);
    protected readonly appointments = signal<Appointment[]>([]);
    protected readonly totalAppointments = signal(0);
    protected readonly currentPage = signal(1);
    protected readonly appointmentsLimit = signal(5);
    protected readonly clinicalHistory = signal<ClinicalRecordRDA[]>([]);
    protected readonly billingHistory = signal<BillingRecord[]>([]);
    protected readonly nextAppointment = signal<Appointment | null>(null);
    protected readonly isLoading = signal(true);
    protected readonly isNextAppLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);

    // Check-In Drawer State
    protected readonly isCheckInDrawerOpen = signal(false);
    protected readonly catalogItems = signal<CatalogItem[]>([]);

    protected readonly UserRole = UserRole;

    ngOnInit(): void {
        const patientId = this.route.snapshot.paramMap.get('id');
        this.loadCatalog();
        if (patientId) {
            this.loadPatientData(patientId);
        } else {
            this.router.navigate(['/admin/patients']);
        }
    }

    private loadCatalog(): void {
        this.mastersService.getCatalog().subscribe({
            next: (res) => {
                if (res.success) this.catalogItems.set(res.data);
            }
        });
    }

    private loadPatientData(id: string): void {
        this.isLoading.set(true);
        this.patientService.getPatientById(id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.patient.set(res.data);
                    this.loadRelatedData(id);
                } else {
                    this.router.navigate(['/admin/patients']);
                }
            },
            error: () => this.router.navigate(['/admin/patients'])
        });
    }

    private loadRelatedData(patientId: string): void {
        this.loadAppointments(patientId, this.currentPage());

        // Historial Clínico Local (Solo para Médicos)
        if (this.authService.userRole() === UserRole.MEDICO) {
            this.rdaService.getLocalHistory(patientId).subscribe({
                next: (res: any) => {
                    if (res.success) {
                        this.clinicalHistory.set(res.data);
                    }
                }
            });
        }

        // Mock Billing (ya que no hay servicio aún)
        if (this.authService.userRole() !== UserRole.MEDICO) {
            this.billingHistory.set([
                { id: 'FAC-001', date: '2024-01-15', concept: 'Consulta General', amount: 50000, status: 'PAGADO' },
                { id: 'FAC-002', date: '2024-02-10', concept: 'Laboratorio Clínico', amount: 120000, status: 'PAGADO' },
                { id: 'FAC-003', date: '2024-03-05', concept: 'Electrocardiograma', amount: 85000, status: 'PENDIENTE' }
            ]);
        }

        // Cargar Siguiente Cita
        const today = new Date().toISOString().split('T')[0];
        this.isNextAppLoading.set(true);
        this.appointmentService.getNextAppointmentByPatientId(patientId, today).subscribe({
            next: (res) => {
                if (res.success) {
                    this.nextAppointment.set(res.data);
                }
                this.isNextAppLoading.set(false);
            },
            error: () => this.isNextAppLoading.set(false)
        });

        this.isLoading.set(false);
    }

    private loadAppointments(patientId: string, page: number): void {
        this.appointmentService.getPatientAppointmentHistory(patientId, page, this.appointmentsLimit()).subscribe({
            next: (res) => {
                if (res.success) {
                    this.appointments.set(res.data.data);
                    this.totalAppointments.set(res.data.total);
                }
            }
        });
    }

    protected onLimitChange(limit: any): void {
        const numLimit = Number(limit);
        this.appointmentsLimit.set(numLimit);
        this.currentPage.set(1);
        const patientId = this.patient()?.id;
        if (patientId) {
            this.loadAppointments(patientId, 1);
        }
    }

    protected onPageChange(page: number): void {
        const patientId = this.patient()?.id;
        if (patientId) {
            this.currentPage.set(page);
            this.loadAppointments(patientId, page);
        }
    }

    protected readonly totalPages = computed(() =>
        Math.ceil(this.totalAppointments() / this.appointmentsLimit())
    );

    protected openCheckIn(): void {
        this.isCheckInDrawerOpen.set(true);
    }

    protected onCheckInProcessed(): void {
        // Recargar datos para ver el cambio de estado en la próxima cita
        if (this.patient()) {
            this.loadRelatedData(this.patient()!.id);
        }
    }

    protected toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }

    protected goBack(): void {
        this.router.navigate(['/admin/patients']);
    }

    protected getStatusClasses(status: string): string {
        switch (status) {
            case 'PENDIENTE': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CONFIRMADA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELADA': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'COMPLETADA': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'EN_CONSULTA': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'PAGADO': return 'bg-green-100 text-green-700 border-green-200';
            case 'ANULADO': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    }
}

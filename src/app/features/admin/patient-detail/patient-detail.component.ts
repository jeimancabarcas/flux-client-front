import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { RdaService } from '../../../core/services/rda.service';
import { MedicalRecordService } from '../../../core/services/medical-record.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient } from '../../../core/models/patient.model';
import { Appointment } from '../../../core/models/appointment.model';
import { MedicalRecordHistoryItem } from '../../../core/models/medical-record.model';
import { UserRole } from '../../../core/models/user.model';
import { SidebarComponent } from '../../../shared/components/organisms/sidebar/sidebar.component';
import { CheckInDrawerComponent } from '../../appointments/components/check-in-drawer/check-in-drawer.component';
import { MastersService } from '../../../core/services/masters.service';
import { BillingService } from '../../../core/services/billing.service';
import { CatalogItem } from '../../../core/models/masters.model';
import { DataTableComponent } from '../../../shared/components/organisms/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/molecules/modal/modal.component';
import { RdaViewerComponent } from '../../consultation/components/rda-viewer/rda-viewer.component';
import { ClinicalRecordRDA, RdaType } from '../../../core/models/rda.model';

interface BillingRecord {
    id: string;
    date: string;
    concept: string;
    amount: number;
    status: 'PAGADO' | 'PENDIENTE' | 'ANULADO';
}

@Component({
    selector: 'app-patient-detail',
    imports: [CommonModule, FormsModule, SidebarComponent, CheckInDrawerComponent, DataTableComponent, ModalComponent, RdaViewerComponent],
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
    private readonly medicalRecordService = inject(MedicalRecordService);
    private readonly mastersService = inject(MastersService);
    private readonly billingService = inject(BillingService);
    protected readonly authService = inject(AuthService);

    // State
    protected readonly patient = signal<Patient | null>(null);
    protected readonly appointments = signal<Appointment[]>([]);
    protected readonly totalAppointments = signal(0);
    protected readonly currentPage = signal(1);
    protected readonly appointmentsLimit = signal(5);
    protected readonly clinicalHistory = signal<MedicalRecordHistoryItem[]>([]);
    protected readonly clinicalHistoryLimit = signal(5);
    protected readonly clinicalHistoryPage = signal(1);
    protected readonly clinicalHistoryTotal = signal(0);
    protected readonly clinicalHistoryHasMore = signal(false);
    protected readonly billingHistory = signal<BillingRecord[]>([]);
    protected readonly nextAppointment = signal<Appointment | null>(null);
    protected readonly isLoading = signal(true);
    protected readonly isNextAppLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);
    protected readonly selectedRda = signal<ClinicalRecordRDA | null>(null);
    protected readonly isRdaModalOpen = signal(false);
    protected readonly isRdaLoading = signal(false);

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
            this.loadClinicalHistory(patientId, 1);
        }

        // Historial de Facturacion Real
        if (this.authService.userRole() !== UserRole.MEDICO) {
            this.billingService.getInvoicesByPatientId(patientId).subscribe({
                next: (res) => {
                    if (res.success) {
                        // Transformar datos según la estructura real de la API (totalAmount)
                        const mappedInvoices: BillingRecord[] = res.data.map((inv: any) => ({
                            id: inv.id,
                            date: inv.createdAt,
                            concept: inv.items && inv.items.length > 0
                                ? (inv.items[0].productService?.name || 'Factura de Venta')
                                : 'Factura de Venta',
                            amount: inv.totalAmount || 0,
                            status: inv.status || 'PAGADA'
                        }));
                        this.billingHistory.set(mappedInvoices);
                    }
                }
            });
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

    private loadClinicalHistory(patientId: string, page: number): void {
        this.medicalRecordService.getHistoryByPatient(patientId, page, this.clinicalHistoryLimit()).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.clinicalHistory.set(res.data);
                    this.clinicalHistoryTotal.set(res.total || res.data.length);
                    this.clinicalHistoryHasMore.set(res.data.length === this.clinicalHistoryLimit());
                }
            }
        });
    }

    protected viewRdaDetail(recordId: string): void {
        this.isRdaLoading.set(true);
        this.isRdaModalOpen.set(true);

        // Buscamos el registro en la lista actual
        const record = this.clinicalHistory().find(r => r.id === recordId);
        if (!record) return;

        // Mapeamos los datos básicos que ya tenemos para una vista rápida o fetch completo si es necesario
        // En este caso, el servicio de RDA generalmente se usa para registros completos de IHCE o Locales Flux.
        // Si el historial clínico local usa MedicalRecordHistoryItem, mapeamos a ClinicalRecordRDA para el visor.
        const mappedRda: ClinicalRecordRDA = {
            appointmentId: '', // No disponible directamente en el history item simplificado del frontend
            patientId: this.patient()?.id || '',
            doctorId: record.doctorId || '',
            type: RdaType.CONSULTA_EXTERNA,
            reasonForConsultation: record.reason,
            currentIllness: record.currentIllness,
            physicalExamination: record.physicalExamination?.content || 'No registrado',
            vitalSigns: record.physicalExamination ? {
                bloodPressure: `${record.physicalExamination.systolicBloodPressure || '--'}/${record.physicalExamination.diastolicBloodPressure || '--'}`,
                heartRate: record.physicalExamination.heartRate,
                respiratoryRate: record.physicalExamination.respiratoryRate,
                temperature: record.physicalExamination.temperature,
                weight: record.physicalExamination.weight,
                height: record.physicalExamination.height
            } : undefined,
            diagnoses: record.diagnoses.map((d, i) => ({
                code: `DX-${i + 1}`,
                description: d,
                type: 'PRINCIPAL'
            })),
            medications: [],
            planAndTreatment: (record as any).plan || 'No registrado', // El history item a veces oculta el plan, forzamos casteo si existe
            recommendations: '',
            createdAt: record.createdAt
        };

        this.selectedRda.set(mappedRda);
        this.isRdaLoading.set(false);
    }

    protected closeRdaModal(): void {
        this.isRdaModalOpen.set(false);
        this.selectedRda.set(null);
    }

    protected onClinicalHistoryPageChange(pageIdx: number): void {
        const patientId = this.patient()?.id;
        if (patientId) {
            this.clinicalHistoryPage.set(pageIdx);
            this.loadClinicalHistory(patientId, pageIdx);
        }
    }

    protected onClinicalHistoryLimitChange(limit: number): void {
        this.clinicalHistoryLimit.set(limit);
        this.clinicalHistoryPage.set(1);
        const patientId = this.patient()?.id;
        if (patientId) {
            this.loadClinicalHistory(patientId, 1);
        }
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

    protected readonly clinicalHistoryTotalPages = computed(() =>
        Math.ceil(this.clinicalHistoryTotal() / this.clinicalHistoryLimit())
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
            case 'PAGADO':
            case 'PAGADA': return 'bg-green-100 text-green-700 border-green-200';
            case 'EMITIDA': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'ANULADO': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    }
}

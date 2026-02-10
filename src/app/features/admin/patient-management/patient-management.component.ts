import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient } from '../../../core/models/patient.model';
import { SidebarComponent } from '../../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../../shared/components/molecules/modal/modal.component';
import { TableComponent } from '../../../shared/components/organisms/table/table.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MastersService } from '../../../core/services/masters.service';
import { Eps, Prepagada } from '../../../core/models/masters.model';

@Component({
    selector: 'app-patient-management',
    imports: [CommonModule, SidebarComponent, ModalComponent, ReactiveFormsModule, TableComponent],
    templateUrl: './patient-management.component.html',
    styleUrl: './patient-management.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientManagementComponent implements OnInit {
    private readonly patientService = inject(PatientService);
    protected readonly authService = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly mastersService = inject(MastersService);

    // State Signals
    protected readonly patients = signal<Patient[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);
    protected readonly isFormModalOpen = signal(false);
    protected readonly selectedPatient = signal<Patient | null>(null);
    protected readonly searchTerm = signal('');
    protected readonly currentPage = signal(1);
    protected readonly totalPages = signal(1);
    protected readonly totalRecords = signal(0);
    protected readonly pageSize = 10;

    // Master signals
    protected readonly epsOptions = signal<Eps[]>([]);
    protected readonly prepagadaOptions = signal<Prepagada[]>([]);

    // Form
    protected patientForm!: FormGroup;

    // Computed
    protected readonly filteredPatients = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.patients();

        return this.patients().filter(p =>
            p.nombres.toLowerCase().includes(term) ||
            p.apellidos.toLowerCase().includes(term) ||
            p.numeroIdentificacion.includes(term) ||
            p.email?.toLowerCase().includes(term)
        );
    });

    ngOnInit(): void {
        this.initForm();
        this.loadPatients();
        this.loadMasters();
    }

    private loadMasters(): void {
        this.mastersService.getEpsList().subscribe(res => {
            if (res.success) this.epsOptions.set(res.data.filter(i => i.isActive));
        });
        this.mastersService.getPrepagadaList().subscribe(res => {
            if (res.success) this.prepagadaOptions.set(res.data.filter(i => i.isActive));
        });
    }

    private initForm(): void {
        this.patientForm = this.fb.group({
            nombres: ['', Validators.required],
            apellidos: ['', Validators.required],
            tipoIdentificacion: ['CC', Validators.required],
            numeroIdentificacion: ['', Validators.required],
            fechaNacimiento: ['', Validators.required],
            genero: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            telefono: ['', Validators.required],
            direccion: ['', Validators.required],
            eps: [''],
            prepagada: [''],
            habeasDataConsent: [false, Validators.requiredTrue]
        });
    }

    protected loadPatients(page: number = 1): void {
        this.isLoading.set(true);
        this.patientService.getPatients(page, this.pageSize, this.searchTerm()).subscribe({
            next: (res) => {
                if (res.success) {
                    this.patients.set(res.data.data);
                    this.currentPage.set(res.data.meta.page);
                    this.totalPages.set(res.data.meta.totalPages);
                    this.totalRecords.set(res.data.meta.total);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected onSearch(term: string): void {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.loadPatients(1);
    }

    protected nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.loadPatients(this.currentPage() + 1);
        }
    }

    protected prevPage(): void {
        if (this.currentPage() > 1) {
            this.loadPatients(this.currentPage() - 1);
        }
    }

    protected openCreateModal(): void {
        this.selectedPatient.set(null);
        this.patientForm.reset({
            tipoIdentificacion: 'CC',
            habeasDataConsent: false
        });
        this.isFormModalOpen.set(true);
    }

    protected openEditModal(patient: Patient): void {
        this.selectedPatient.set(patient);
        this.patientForm.patchValue({
            nombres: patient.nombres,
            apellidos: patient.apellidos,
            tipoIdentificacion: patient.tipoIdentificacion,
            numeroIdentificacion: patient.numeroIdentificacion,
            fechaNacimiento: patient.fechaNacimiento,
            genero: patient.genero,
            email: patient.email,
            telefono: patient.telefono,
            direccion: patient.direccion,
            eps: patient.eps || '',
            prepagada: patient.prepagada || '',
            habeasDataConsent: patient.habeasDataConsent
        });
        this.isFormModalOpen.set(true);
    }

    protected onSubmit(): void {
        if (this.patientForm.invalid) return;

        this.isLoading.set(true);
        const formValue = this.patientForm.value;

        const request$ = this.selectedPatient()
            ? this.patientService.updatePatient(this.selectedPatient()!.id, formValue)
            : this.patientService.createPatient(formValue);

        request$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadPatients(this.currentPage());
                    this.isFormModalOpen.set(false);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected deletePatient(patient: Patient): void {
        if (!confirm(`¿Está seguro de eliminar al paciente ${patient.nombres} ${patient.apellidos}?`)) return;

        this.isLoading.set(true);
        this.patientService.deletePatient(patient.id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadPatients(this.currentPage());
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected viewPatientDetail(id: string): void {
        this.router.navigate(['/admin/patients', id]);
    }

    protected toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }
}

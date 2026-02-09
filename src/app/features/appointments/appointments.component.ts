import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { UserService } from '../../core/services/user.service';
import { Appointment, CalendarView, AppointmentStatus } from '../../core/models/appointment.model';
import { Patient } from '../../core/models/patient.model';
import { User } from '../../core/models/user.model';
import { SidebarComponent } from '../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../shared/components/molecules/modal/modal.component';
import { SearchableSelectComponent, SearchableOption } from '../../shared/components/atoms/searchable-select/searchable-select.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HostListener } from '@angular/core';

@Component({
    selector: 'app-appointments',
    imports: [CommonModule, SidebarComponent, ModalComponent, ReactiveFormsModule, SearchableSelectComponent],
    templateUrl: './appointments.component.html',
    styleUrl: './appointments.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsComponent implements OnInit {
    private readonly appointmentService = inject(AppointmentService);
    protected readonly authService = inject(AuthService);
    private readonly patientService = inject(PatientService);
    private readonly userService = inject(UserService);
    private readonly fb = inject(FormBuilder);

    // State Signals
    protected readonly currentDate = signal(new Date());
    protected readonly viewMode = signal<CalendarView>('week');
    protected readonly appointments = signal<Appointment[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);

    // Enums for template
    protected readonly AppointmentStatus = AppointmentStatus;

    // Modal State
    protected readonly isFormModalOpen = signal(false);
    protected readonly selectedAppointment = signal<Appointment | null>(null);
    protected readonly activeTooltipId = signal<string | null>(null);
    protected appointmentForm!: FormGroup;

    // Patient Search
    protected readonly patients = signal<Patient[]>([]);
    protected readonly searchingPatients = signal(false);
    protected readonly patientSearchTerm = signal('');

    // Doctor Search
    protected readonly doctors = signal<User[]>([]);
    protected readonly loadingDoctors = signal(false);

    // Computed Options for Searchable Selects
    protected readonly patientOptions = computed<SearchableOption[]>(() =>
        this.patients().map(p => ({
            value: p.id,
            label: `${p.nombres} ${p.apellidos}`,
            sublabel: p.numeroIdentificacion
        }))
    );

    protected readonly doctorOptions = computed<SearchableOption[]>(() =>
        this.doctors().map(d => {
            const details = d.details || d.detalles;
            const name = details ? `Dr. ${details.nombre} ${details.apellido}` : d.email;
            const specialties = d.specialties?.map(s => s.name).join(', ') || 'Sin especialidad';
            return {
                value: d.id,
                label: name,
                sublabel: specialties
            };
        })
    );

    // Constants
    protected readonly daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    protected readonly hours = Array.from({ length: 24 }, (_, i) => i);

    constructor() {
        this.initForm();
        this.setupPatientSearch();
    }

    ngOnInit(): void {
        this.loadAppointments();
        this.loadInitialPatients();
        this.loadDoctors();
    }

    private initForm(): void {
        this.appointmentForm = this.fb.group({
            patientId: ['', Validators.required],
            doctorId: ['', Validators.required],
            startTime: ['', Validators.required],
            horaInicio: ['', Validators.required],
            duracion: [30, [Validators.required, Validators.min(15)]],
            reason: ['', Validators.required],
            status: [AppointmentStatus.PENDIENTE]
        });
    }

    // Computed data for the calendar grid
    protected readonly daysInView = computed(() => {
        const date = this.currentDate();
        const mode = this.viewMode();

        if (mode === 'day') {
            return [new Date(date)];
        }

        if (mode === 'week') {
            const start = new Date(date);
            start.setDate(date.getDate() - date.getDay());
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return d;
            });
        }

        // Month view
        const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startGrid = new Date(startMonth);
        startGrid.setDate(startMonth.getDate() - startMonth.getDay());

        const days = [];
        const temp = new Date(startGrid);
        // 6 weeks grid
        while (days.length < 42) {
            days.push(new Date(temp));
            temp.setDate(temp.getDate() + 1);
        }
        return days;
    });

    protected readonly monthLabel = computed(() => {
        return this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    });

    // Actions
    protected loadAppointments(): void {
        this.isLoading.set(true);
        const days = this.daysInView();

        const startDate = new Date(days[0]);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(days[days.length - 1]);
        endDate.setHours(23, 59, 59, 999);

        this.appointmentService.getAppointments(startDate.toISOString(), endDate.toISOString()).subscribe({
            next: (res) => {
                if (res.success) this.appointments.set(res.data);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected setView(view: CalendarView): void {
        this.viewMode.set(view);
        this.loadAppointments();
    }

    protected next(): void {
        const date = new Date(this.currentDate());
        const mode = this.viewMode();
        if (mode === 'day') date.setDate(date.getDate() + 1);
        else if (mode === 'week') date.setDate(date.getDate() + 7);
        else date.setMonth(date.getMonth() + 1);
        this.currentDate.set(date);
        this.loadAppointments();
    }

    protected prev(): void {
        const date = new Date(this.currentDate());
        const mode = this.viewMode();
        if (mode === 'day') date.setDate(date.getDate() - 1);
        else if (mode === 'week') date.setDate(date.getDate() - 7);
        else date.setMonth(date.getMonth() - 1);
        this.currentDate.set(date);
        this.loadAppointments();
    }

    protected today(): void {
        this.currentDate.set(new Date());
        this.loadAppointments();
    }

    protected toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }

    @HostListener('document:click', ['$event'])
    protected onClickOutside(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.group\\/card')) {
            this.activeTooltipId.set(null);
        }
    }

    protected toggleTooltip(appId: string, event: MouseEvent): void {
        event.stopPropagation();
        if (this.activeTooltipId() === appId) {
            this.activeTooltipId.set(null);
        } else {
            this.activeTooltipId.set(appId);
        }
    }

    protected closeTooltip(): void {
        this.activeTooltipId.set(null);
    }

    protected canEdit(status: AppointmentStatus): boolean {
        return status === AppointmentStatus.PENDIENTE || status === AppointmentStatus.CONFIRMADA;
    }

    protected openEditModal(app: Appointment, event: MouseEvent): void {
        event.stopPropagation();
        this.activeTooltipId.set(null);
        this.selectedAppointment.set(app);

        const start = new Date(app.startTime);
        this.appointmentForm.patchValue({
            patientId: app.patientId,
            doctorId: app.doctorId,
            startTime: start.toISOString().split('T')[0],
            horaInicio: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
            duracion: this.getDuration(app),
            reason: app.reason,
            status: app.status
        });
        this.isFormModalOpen.set(true);
    }

    protected deleteAppointment(appId: string, event: MouseEvent): void {
        event.stopPropagation();
        if (!confirm('¿Está seguro de eliminar esta cita permanentemente?')) return;

        this.isLoading.set(true);
        this.appointmentService.deleteAppointment(appId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadAppointments();
                    this.activeTooltipId.set(null);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    // Patient Management
    private loadInitialPatients(): void {
        this.patientService.getPatients(1, 50).subscribe({
            next: (res) => {
                if (res.success) {
                    this.patients.set(res.data.data);
                }
            },
            error: (err) => console.error('Error loading patients:', err)
        });
    }

    private setupPatientSearch(): void {
        // Implementar búsqueda reactiva cuando se implemente el input de búsqueda
    }

    protected searchPatients(term: string): void {
        if (!term || term.length < 2) {
            this.loadInitialPatients();
            return;
        }

        this.searchingPatients.set(true);
        this.patientService.searchPatients(term).subscribe({
            next: (res) => {
                if (res.success) {
                    this.patients.set(res.data.data);
                }
                this.searchingPatients.set(false);
            },
            error: () => this.searchingPatients.set(false)
        });
    }

    private loadDoctors(): void {
        this.loadingDoctors.set(true);
        this.userService.getDoctors().subscribe({
            next: (res) => {
                if (res.success) {
                    this.doctors.set(res.data);
                }
                this.loadingDoctors.set(false);
            },
            error: (err) => {
                console.error('Error loading doctors:', err);
                this.loadingDoctors.set(false);
            }
        });
    }

    protected openCreateModal(date?: Date, hour?: number): void {
        this.selectedAppointment.set(null);
        this.appointmentForm.reset({
            startTime: date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            horaInicio: hour !== undefined ? `${hour.toString().padStart(2, '0')}:00` : '08:00',
            duracion: 30,
            status: AppointmentStatus.PENDIENTE
        });
        this.isFormModalOpen.set(true);
    }

    protected onSubmit(): void {
        if (this.appointmentForm.invalid) return;

        this.isLoading.set(true);
        const formValue = this.appointmentForm.value;

        // Combinar fecha y hora en un solo ISO string
        const dateTimeStart = new Date(`${formValue.startTime}T${formValue.horaInicio}:00`);

        const payload = {
            patientId: formValue.patientId,
            doctorId: formValue.doctorId,
            startTime: dateTimeStart.toISOString(),
            durationMinutes: Number(formValue.duracion), // Asegurar que sea número
            reason: formValue.reason,
            status: formValue.status
        };

        const request$ = this.selectedAppointment()
            ? this.appointmentService.updateAppointment(this.selectedAppointment()!.id, payload)
            : this.appointmentService.createAppointment(payload);

        request$.subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadAppointments();
                    this.isFormModalOpen.set(false);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    // Utilities for rendering
    protected isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    protected getAppointmentsForDay(date: Date): Appointment[] {
        return this.appointments().filter(a => {
            const aDate = new Date(a.startTime);
            return aDate.getDate() === date.getDate() &&
                aDate.getMonth() === date.getMonth() &&
                aDate.getFullYear() === date.getFullYear();
        });
    }

    protected getPosition(app: Appointment): { top: string, height: string, left: string, width: string } {
        const start = new Date(app.startTime);
        const durationInMinutes = this.getDuration(app);

        const minutesFromStartOfDay = start.getHours() * 60 + start.getMinutes();
        const top = (minutesFromStartOfDay / 60) * 60; // 60px por hora
        const height = (durationInMinutes / 60) * 60;

        // Lógica de solapamiento
        const dayAppointments = this.getAppointmentsForDay(start);
        const overlapping = dayAppointments.filter(other => {
            if (other.id === app.id) return false;
            const otherStart = new Date(other.startTime);
            const otherEnd = new Date(other.endTime);
            const thisEnd = new Date(app.endTime);
            return (start < otherEnd && thisEnd > otherStart);
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const index = overlapping.filter(other => new Date(other.startTime).getTime() < start.getTime() || (new Date(other.startTime).getTime() === start.getTime() && other.id < app.id)).length;
        const total = overlapping.length + 1;

        const width = 95 / total;
        const left = (index * width) + 1;

        return {
            top: `${top}px`,
            height: `${height}px`,
            left: `${left}%`,
            width: `${width}%`
        };
    }

    protected getDuration(app: Appointment): number {
        const start = new Date(app.startTime);
        const end = new Date(app.endTime);
        return (end.getTime() - start.getTime()) / 60000;
    }

    protected getStatusClasses(status: AppointmentStatus): string {
        const base = 'border-l-4 transition-all ';
        switch (status) {
            case AppointmentStatus.PENDIENTE:
                return base + 'bg-amber-50 border-amber-400 text-amber-700 shadow-amber-100';
            case AppointmentStatus.CONFIRMADA:
                return base + 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-emerald-100';
            case AppointmentStatus.EN_CONSULTA:
                return base + 'bg-cyan-50 border-cyan-400 text-cyan-700 shadow-cyan-100 animate-pulse';
            case AppointmentStatus.COMPLETADA:
                return base + 'bg-slate-50 border-slate-300 text-slate-500 shadow-slate-50 opacity-75';
            case AppointmentStatus.CANCELADA:
                return base + 'bg-rose-50 border-rose-400 text-rose-700 shadow-rose-100 line-through opacity-60';
            default:
                return base + 'bg-slate-50 border-slate-200 text-slate-600';
        }
    }
}

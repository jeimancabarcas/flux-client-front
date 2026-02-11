import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { UserService } from '../../core/services/user.service';
import { Appointment, CalendarView, AppointmentStatus } from '../../core/models/appointment.model';
import { Patient } from '../../core/models/patient.model';
import { User, UserRole } from '../../core/models/user.model';
import { SidebarComponent } from '../../shared/components/organisms/sidebar/sidebar.component';
import { ModalComponent } from '../../shared/components/molecules/modal/modal.component';
import { SearchableSelectComponent, SearchableOption } from '../../shared/components/atoms/searchable-select/searchable-select.component';
import { DateSelectorComponent } from '../../shared/components/molecules/date-selector/date-selector.component';
import { CheckInDrawerComponent } from './components/check-in-drawer/check-in-drawer.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MastersService } from '../../core/services/masters.service';
import { CatalogItem } from '../../core/models/masters.model';

@Component({
    selector: 'app-appointments',
    imports: [CommonModule, SidebarComponent, ModalComponent, ReactiveFormsModule, FormsModule, SearchableSelectComponent, DateSelectorComponent, CheckInDrawerComponent],
    templateUrl: './appointments.component.html',
    styleUrl: './appointments.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(document:click)': 'onClickOutside($event)'
    }
})
export class AppointmentsComponent implements OnInit {
    private readonly appointmentService = inject(AppointmentService);
    protected readonly authService = inject(AuthService);
    private readonly patientService = inject(PatientService);
    private readonly userService = inject(UserService);
    private readonly mastersService = inject(MastersService);
    private readonly fb = inject(FormBuilder);

    // State Signals
    protected readonly currentDate = signal(new Date());
    protected readonly viewMode = signal<CalendarView>('week');
    protected readonly appointments = signal<Appointment[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly isSidebarOpen = signal(false);
    protected readonly isRescheduleMode = signal(false);
    protected readonly cancellingId = signal<string | null>(null);
    protected readonly cancelReason = signal('');
    protected readonly todayDate = signal(new Date());
    protected readonly statusFilter = signal<AppointmentStatus | 'TODOS'>('TODOS');
    protected readonly doctorFilter = signal<string>('TODOS');
    protected readonly patientFilter = signal<string>('TODOS');

    // Enums for template
    protected readonly AppointmentStatus = AppointmentStatus;
    protected readonly UserRole = UserRole;
    protected readonly availableStatuses: (AppointmentStatus | 'TODOS')[] = [
        'TODOS',
        AppointmentStatus.PENDIENTE,
        AppointmentStatus.CONFIRMADA,
        AppointmentStatus.EN_CONSULTA,
        AppointmentStatus.COMPLETADA,
        AppointmentStatus.CANCELADA
    ];

    // Modal State
    protected readonly isFormModalOpen = signal(false);
    protected readonly selectedAppointment = signal<Appointment | null>(null);
    protected readonly activeTooltipId = signal<string | null>(null);
    protected appointmentForm!: FormGroup;

    // Check-In Drawer State
    protected readonly isCheckInDrawerOpen = signal(false);
    protected readonly checkInAppointment = signal<Appointment | null>(null);

    // Patient Search
    protected readonly patients = signal<Patient[]>([]);
    protected readonly searchingPatients = signal(false);
    protected readonly patientSearchTerm = signal('');

    // Doctor Search
    protected readonly doctors = signal<User[]>([]);
    protected readonly loadingDoctors = signal(false);

    // Catalog items
    protected readonly catalogItems = signal<CatalogItem[]>([]);
    protected readonly searchingCatalog = signal(false);

    // Reactive signal to track IDs in the form for immediate UI feedback
    protected readonly selectedIdsInForm = signal<string[]>([]);

    // Computed to show details of selected items
    protected readonly selectedItemsList = computed(() => {
        const ids = this.selectedIdsInForm();
        return this.catalogItems().filter(i => ids.includes(i.id));
    });

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

    protected readonly catalogOptions = computed<SearchableOption[]>(() =>
        this.catalogItems()
            .filter(i => i.isActive)
            .map(i => ({
                value: i.id,
                label: i.name,
                sublabel: `${i.code} | $${i.price.toLocaleString()}`
            }))
    );

    protected readonly displayAppointments = computed(() => {
        let filtered = this.appointments();

        // 1. Filtro por Estado
        const sFilter = this.statusFilter();
        if (sFilter !== 'TODOS') {
            filtered = filtered.filter(a => a.status === sFilter);
        }

        // 2. Filtro por Médico (Solo aplica para Recepcionista/Admin)
        const dFilter = this.doctorFilter();
        if (dFilter && dFilter !== 'TODOS') {
            filtered = filtered.filter(a => a.doctorId === dFilter);
        }

        // 3. Filtro por Paciente
        const pFilter = this.patientFilter();
        if (pFilter && pFilter !== 'TODOS') {
            filtered = filtered.filter(a => a.patientId === pFilter);
        }

        return filtered;
    });

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
        this.loadCatalog();
        if (this.authService.userRole() !== UserRole.MEDICO) {
            this.loadDoctors();
        }
    }

    private initForm(): void {
        this.appointmentForm = this.fb.group({
            patientId: ['', Validators.required],
            doctorId: ['', Validators.required],
            schedule: ['', Validators.required], // Objeto { date, time }
            duracion: [30, [Validators.required, Validators.min(15)]],
            reason: ['', Validators.required],
            status: [AppointmentStatus.PENDIENTE],
            itemIds: [[]]
        }, { validators: this.futureDateValidator });

        // Synchronize signal with form changes
        this.appointmentForm.get('itemIds')?.valueChanges.subscribe(val => {
            this.selectedIdsInForm.set(val || []);
        });
    }

    /**
     * Validador para asegurar que la cita no sea en el pasado
     */
    private futureDateValidator: any = (group: FormGroup) => {
        const schedule = group.get('schedule')?.value;

        if (!schedule || !schedule.date || !schedule.time) return { incomplete: true };

        const appointmentDate = new Date(`${schedule.date}T${schedule.time}:00`);
        const now = new Date();

        return appointmentDate < now ? { pastDate: true } : null;
    };

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

    protected openRescheduleModal(app: Appointment, event: MouseEvent): void {
        event.stopPropagation();
        this.activeTooltipId.set(null);
        this.selectedAppointment.set(app);
        this.isRescheduleMode.set(true);

        const start = new Date(app.startTime);
        const dateStr = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;

        this.appointmentForm.patchValue({
            patientId: app.patientId,
            doctorId: app.doctorId,
            schedule: { date: dateStr, time: timeStr },
            duracion: this.getDuration(app),
            reason: app.reason,
            status: app.status,
            itemIds: app.itemIds || []
        });

        // Sincronizar la señal para que se vean los items inmediatamente
        this.selectedIdsInForm.set(app.itemIds || []);

        // Deshabilitar campos que no se pueden modificar en reprogramación
        this.appointmentForm.get('patientId')?.disable();
        this.appointmentForm.get('doctorId')?.disable();
        this.appointmentForm.get('reason')?.disable();
        this.appointmentForm.get('status')?.disable();

        this.isFormModalOpen.set(true);
    }


    protected startConsultation(appId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.isLoading.set(true);
        this.appointmentService.startAppointment(appId).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.loadAppointments();
                    this.activeTooltipId.set(null);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected openCancel(appId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.cancellingId.set(appId);
        this.cancelReason.set('');
    }

    protected closeCancel(event?: MouseEvent): void {
        event?.stopPropagation();
        this.cancellingId.set(null);
        this.cancelReason.set('');
    }

    protected onCancelAppointment(appId: string, event: MouseEvent): void {
        event.stopPropagation();
        const reason = this.cancelReason().trim();

        if (!reason) return;

        this.isLoading.set(true);
        this.appointmentService.cancelAppointment(appId, reason).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.loadAppointments();
                    this.activeTooltipId.set(null);
                    this.cancellingId.set(null);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    // Check-In Methods
    protected openCheckIn(app: Appointment, event: MouseEvent): void {
        event.stopPropagation();
        this.activeTooltipId.set(null); // Close tooltip
        this.checkInAppointment.set(app);

        // Small timeout to ensure tooltip closes and z-index doesn't conflict immediately
        setTimeout(() => {
            this.isCheckInDrawerOpen.set(true);
        }, 50);
    }

    protected closeCheckIn(): void {
        this.isCheckInDrawerOpen.set(false);
        this.checkInAppointment.set(null);
    }

    protected onCheckInProcessed(): void {
        this.loadAppointments(); // Recargar citas para ver el cambio de estado
        this.isCheckInDrawerOpen.set(false);
    }

    // Patient Management
    private loadInitialPatients(): void {
        this.patientService.getPatients(1, 5).subscribe({
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

    private loadCatalog(): void {
        this.mastersService.getCatalog().subscribe({
            next: (res) => {
                if (res.success) this.catalogItems.set(res.data);
            }
        });
    }

    protected searchCatalog(term: string): void {
        if (!term || term.length < 2) {
            this.loadCatalog();
            return;
        }

        this.searchingCatalog.set(true);
        this.mastersService.searchCatalog(term).subscribe({
            next: (res) => {
                if (res.success) {
                    // Mezclar con los ya cargados para no perder referencias de items seleccionados
                    const currentItems = this.catalogItems();
                    const newItems = res.data.filter(ni => !currentItems.find(ci => ci.id === ni.id));
                    this.catalogItems.set([...currentItems, ...newItems]);
                }
                this.searchingCatalog.set(false);
            },
            error: () => this.searchingCatalog.set(false)
        });
    }

    protected removeItem(itemId: string): void {
        const currentIds = this.appointmentForm.get('itemIds')?.value as string[] || [];
        const next = currentIds.filter(id => id !== itemId);
        this.appointmentForm.get('itemIds')?.setValue(next);
        this.selectedIdsInForm.set(next);
    }

    protected openCreateModal(date?: Date, hour?: number): void {
        this.selectedAppointment.set(null);
        this.isRescheduleMode.set(false);

        // Habilitar todos los campos para nueva cita
        this.appointmentForm.get('patientId')?.enable();
        this.appointmentForm.get('doctorId')?.enable();
        this.appointmentForm.get('reason')?.enable();
        this.appointmentForm.get('status')?.enable();

        const d = date || new Date();
        const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        const timeStr = hour !== undefined ? `${hour.toString().padStart(2, '0')}:00` : '08:00';

        const initialValues: any = {
            schedule: { date: dateStr, time: timeStr },
            duracion: 30,
            status: AppointmentStatus.PENDIENTE
        };

        // Si es médico, auto-asignar su ID y deshabilitar el campo
        if (this.authService.userRole() === this.UserRole.MEDICO) {
            initialValues.doctorId = this.authService.currentUser()?.id;
        }

        this.appointmentForm.reset(initialValues);
        this.selectedIdsInForm.set([]);
        this.isFormModalOpen.set(true);
    }

    protected onSubmit(): void {
        if (this.appointmentForm.invalid) return;

        this.isLoading.set(true);
        const formValue = this.appointmentForm.getRawValue(); // Usar getRawValue para incluir campos disabled
        const { date, time } = formValue.schedule;

        const dateTimeStart = new Date(`${date}T${time}:00`);

        if (this.isRescheduleMode() && this.selectedAppointment()) {
            this.appointmentService.rescheduleAppointment(
                this.selectedAppointment()!.id,
                dateTimeStart.toISOString(),
                Number(formValue.duracion) // Asegurar que sea número
            ).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.isFormModalOpen.set(false);
                        this.loadAppointments();
                    }
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false)
            });
            return;
        }

        const payload = {
            patientId: formValue.patientId,
            doctorId: formValue.doctorId,
            startTime: dateTimeStart.toISOString(),
            durationMinutes: Number(formValue.duracion), // Asegurar que sea número
            reason: formValue.reason,
            status: formValue.status,
            itemIds: formValue.itemIds
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
        return this.displayAppointments().filter(a => {
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

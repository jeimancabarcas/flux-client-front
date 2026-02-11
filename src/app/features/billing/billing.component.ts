import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/organisms/sidebar/sidebar.component';
import { SearchableSelectComponent, SearchableOption } from '../../shared/components/atoms/searchable-select/searchable-select.component';
import { PatientService } from '../../core/services/patient.service';
import { MastersService } from '../../core/services/masters.service';
import { BillingService, BillingItem } from '../../core/services/billing.service';
import { CatalogItem, Prepagada, Agreement } from '../../core/models/masters.model';
import { Patient } from '../../core/models/patient.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-billing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SidebarComponent,
        SearchableSelectComponent
    ],
    templateUrl: './billing.component.html',
    styleUrl: './billing.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingComponent implements OnInit {
    private readonly patientService = inject(PatientService);
    private readonly mastersService = inject(MastersService);
    private readonly billingService = inject(BillingService);
    private readonly authService = inject(AuthService);

    // State
    protected readonly isSidebarOpen = signal(false);
    protected readonly isLoading = signal(false);
    protected readonly patients = signal<Patient[]>([]);
    protected readonly catalogItems = signal<CatalogItem[]>([]);
    protected readonly prepagadas = signal<Prepagada[]>([]);
    protected readonly agreements = signal<Agreement[]>([]);

    // Cart / Selection State
    protected readonly selectedPatientId = signal<string>('');
    protected readonly cartItems = signal<BillingItem[]>([]);
    protected readonly paymentType = signal<'PARTICULAR' | 'CONVENIO'>('PARTICULAR');
    protected readonly selectedPrepagadaId = signal<string>('');
    protected readonly authorizationCode = signal<string>('');

    // Search state
    protected readonly searchingPatients = signal(false);

    // Computed Options
    protected readonly patientOptions = computed<SearchableOption[]>(() =>
        this.patients().map(p => ({
            value: p.id,
            label: `${p.nombres} ${p.apellidos}`,
            sublabel: p.numeroIdentificacion
        }))
    );

    protected readonly selectedPatient = computed(() =>
        this.patients().find(p => p.id === this.selectedPatientId())
    );

    protected readonly catalogOptions = computed<SearchableOption[]>(() =>
        this.catalogItems().map(item => ({
            value: item.id,
            label: item.name,
            sublabel: `${item.code} - ${item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`
        }))
    );

    protected readonly totals = computed(() => {
        const cart = this.cartItems();
        const type = this.paymentType();
        const agreementList = this.agreements();

        let subtotal = 0;
        let entityContribution = 0;
        let patientTotal = 0;

        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;

            if (type === 'CONVENIO') {
                const agreement = agreementList.find(a => a.productServiceId === item.id);
                if (agreement) {
                    entityContribution += (agreement.entityAmount * item.quantity);
                    patientTotal += (agreement.patientAmount * item.quantity);
                } else {
                    patientTotal += itemSubtotal;
                }
            } else {
                patientTotal += itemSubtotal;
            }
        });

        return {
            subtotal,
            entityContribution,
            patientTotal
        };
    });

    ngOnInit(): void {
        this.loadInitialPatients();
        this.loadCatalog();
        this.loadPrepagadas();
    }

    // Actions
    protected toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }

    protected searchPatients(term: string): void {
        if (!term || term.length < 2) {
            this.loadInitialPatients();
            return;
        }
        this.searchingPatients.set(true);
        this.patientService.searchPatients(term).subscribe({
            next: (res) => {
                if (res.success) this.patients.set(res.data.data);
                this.searchingPatients.set(false);
            },
            error: () => this.searchingPatients.set(false)
        });
    }

    private loadInitialPatients(): void {
        this.patientService.getPatients(1, 5).subscribe(res => {
            if (res.success) this.patients.set(res.data.data);
        });
    }

    private loadCatalog(): void {
        this.mastersService.getCatalog().subscribe(res => {
            if (res.success) this.catalogItems.set(res.data);
        });
    }

    private loadPrepagadas(): void {
        this.mastersService.getPrepagadaList().subscribe(res => {
            if (res.success) this.prepagadas.set(res.data);
        });
    }

    protected onPrepagadaChange(id: string): void {
        this.selectedPrepagadaId.set(id);
        if (id) {
            this.mastersService.getAgreements(id, true).subscribe(res => {
                if (res.success) this.agreements.set(res.data);
            });
        } else {
            this.agreements.set([]);
        }
    }

    protected addToCart(itemId: string): void {
        if (!itemId) return;
        const catalogItem = this.catalogItems().find(i => i.id === itemId);
        if (!catalogItem) return;

        const currentCart = [...this.cartItems()];
        const existing = currentCart.find(i => i.id === itemId);

        if (existing) {
            existing.quantity += 1;
            this.cartItems.set(currentCart);
        } else {
            this.cartItems.set([...currentCart, {
                id: catalogItem.id,
                name: catalogItem.name,
                code: catalogItem.code,
                price: catalogItem.price,
                quantity: 1
            }]);
        }
    }

    protected updateQuantity(itemId: string, delta: number): void {
        const currentCart = this.cartItems().map(item => {
            if (item.id === itemId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        });
        this.cartItems.set(currentCart);
    }

    protected removeItem(itemId: string): void {
        this.cartItems.set(this.cartItems().filter(i => i.id !== itemId));
    }

    protected submitInvoice(): void {
        if (!this.selectedPatientId() || this.cartItems().length === 0) return;
        if (this.paymentType() === 'CONVENIO' && (!this.selectedPrepagadaId() || !this.authorizationCode().trim())) return;

        this.isLoading.set(true);
        const payload = {
            patientId: this.selectedPatientId(),
            items: this.cartItems().map(i => ({ id: i.id, quantity: i.quantity })),
            paymentType: this.paymentType(),
            prepagadaId: this.selectedPrepagadaId(),
            authorizationCode: this.authorizationCode(),
            total: this.totals().patientTotal
        };

        this.billingService.createInvoice(payload).subscribe({
            next: (res) => {
                if (res.success) {
                    // Reset cart
                    this.cartItems.set([]);
                    this.selectedPatientId.set('');
                    this.authorizationCode.set('');
                    // Show success (could be a toast)
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    protected getAgreementForItem(itemId: string): Agreement | undefined {
        return this.agreements().find(a => a.productServiceId === itemId);
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';

export interface BillingItem {
    id: string;
    quantity: number;
    price: number;
    name: string;
    code: string;
}

export interface BillingPayload {
    patientId: string;
    items: {
        id: string;
        quantity: number;
    }[];
    paymentType: 'PARTICULAR' | 'CONVENIO';
    prepagadaId?: string;
    authorizationCode?: string;
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class BillingService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/billing`;

    /**
     * Crear una factura independiente
     */
    createInvoice(payload: BillingPayload): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(this.apiUrl, payload);
    }

    /**
     * Obtener historial de facturacion por paciente
     */
    getInvoicesByPatientId(patientId: string): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/patient/${patientId}`);
    }

    /**
     * Obtener historial de facturación general
     */
    getBillingHistory(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(this.apiUrl);
    }
}

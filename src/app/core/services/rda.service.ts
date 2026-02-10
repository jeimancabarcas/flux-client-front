import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClinicalRecordRDA } from '../models/rda.model';
import { ApiResponse as GenericApiResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class RdaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/rda`;

    /**
     * Crear un nuevo RDA
     */
    createRda(rda: ClinicalRecordRDA): Observable<GenericApiResponse<ClinicalRecordRDA>> {
        return this.http.post<GenericApiResponse<ClinicalRecordRDA>>(this.apiUrl, rda);
    }

    /**
     * Obtener RDA por ID de cita
     */
    getByAppointmentId(appointmentId: string): Observable<GenericApiResponse<ClinicalRecordRDA>> {
        return this.http.get<GenericApiResponse<ClinicalRecordRDA>>(`${this.apiUrl}/appointment/${appointmentId}`);
    }

    /**
     * Obtener historia clínica local (Flux Medical)
     */
    getLocalHistory(patientId: string): Observable<GenericApiResponse<ClinicalRecordRDA[]>> {
        return this.http.get<GenericApiResponse<ClinicalRecordRDA[]>>(`${this.apiUrl}/history/local/${patientId}`);
    }

    /**
     * Obtener historia clínica interoperable (IHCE)
     */
    getInteroperableHistory(patientId: string): Observable<GenericApiResponse<ClinicalRecordRDA[]>> {
        return this.http.get<GenericApiResponse<ClinicalRecordRDA[]>>(`${this.apiUrl}/history/interoperable/${patientId}`);
    }
}

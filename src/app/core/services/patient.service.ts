import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient, PaginatedPatients } from '../models/patient.model';

interface GenericApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

interface PaginationParams {
    page: string;
    limit: string;
    search?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/patients`;

    getPatients(page: number = 1, limit: number = 10, search: string = ''): Observable<GenericApiResponse<PaginatedPatients>> {
        const params: Record<string, string> = {
            page: page.toString(),
            limit: limit.toString()
        };
        if (search) {
            params['search'] = search;
        }
        return this.http.get<GenericApiResponse<PaginatedPatients>>(this.apiUrl, { params });
    }

    searchPatients(search: string): Observable<GenericApiResponse<PaginatedPatients>> {
        return this.getPatients(1, 50, search);
    }

    /**
     * Obtener un paciente por ID
     */
    getPatientById(id: string): Observable<GenericApiResponse<Patient>> {
        return this.http.get<GenericApiResponse<Patient>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crear nuevo paciente
     */
    createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Observable<GenericApiResponse<Patient>> {
        return this.http.post<GenericApiResponse<Patient>>(this.apiUrl, patient);
    }

    /**
     * Actualizar paciente existente
     */
    updatePatient(id: string, patient: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>): Observable<GenericApiResponse<Patient>> {
        return this.http.patch<GenericApiResponse<Patient>>(`${this.apiUrl}/${id}`, patient);
    }

    /**
     * Eliminar paciente
     */
    deletePatient(id: string): Observable<GenericApiResponse<void>> {
        return this.http.delete<GenericApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}

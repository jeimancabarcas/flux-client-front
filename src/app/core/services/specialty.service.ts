import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Specialty, SpecialtyListResponse, SpecialtyResponse } from '../models/specialty.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class SpecialtyService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/specialties`;

    /**
     * Obtener todas las especialidades
     */
    getSpecialties(): Observable<SpecialtyListResponse> {
        return this.http.get<SpecialtyListResponse>(this.apiUrl);
    }

    /**
     * Obtener una especialidad por ID
     */
    getSpecialtyById(id: string): Observable<SpecialtyResponse> {
        return this.http.get<SpecialtyResponse>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crear nueva especialidad (Solo Admin)
     */
    createSpecialty(data: Partial<Specialty>): Observable<SpecialtyResponse> {
        return this.http.post<SpecialtyResponse>(this.apiUrl, data);
    }

    /**
     * Actualizar especialidad existente (Solo Admin)
     */
    updateSpecialty(id: string, data: Partial<Specialty>): Observable<SpecialtyResponse> {
        return this.http.patch<SpecialtyResponse>(`${this.apiUrl}/${id}`, data);
    }

    /**
     * Eliminar especialidad (Solo Admin)
     */
    deleteSpecialty(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, ApiResponse } from '../models/appointment.model';
import { ApiResponse as GenericApiResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/appointments`;

    /**
     * Obtener citas filtradas por rango de fechas
     */
    getAppointments(start: string, end: string): Observable<GenericApiResponse<Appointment[]>> {
        return this.http.get<GenericApiResponse<Appointment[]>>(`${this.apiUrl}?start=${start}&end=${end}`);
    }

    /**
     * Crear una nueva cita
     */
    createAppointment(appointment: Partial<Appointment>): Observable<GenericApiResponse<Appointment>> {
        return this.http.post<GenericApiResponse<Appointment>>(this.apiUrl, appointment);
    }

    /**
     * Actualizar una cita existente
     */
    updateAppointment(id: string, appointment: Partial<Appointment>): Observable<GenericApiResponse<Appointment>> {
        return this.http.patch<GenericApiResponse<Appointment>>(`${this.apiUrl}/${id}`, appointment);
    }

    /**
     * Eliminar/Cancelar una cita
     */
    deleteAppointment(id: string): Observable<GenericApiResponse<void>> {
        return this.http.delete<GenericApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}

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
     * Obtener una cita específica por su ID
     */
    getAppointmentById(id: string): Observable<GenericApiResponse<Appointment>> {
        return this.http.get<GenericApiResponse<Appointment>>(`${this.apiUrl}/${id}`);
    }

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
     * Finalizar formalmente la consulta de una cita
     */
    completeAppointment(id: string, notes?: string): Observable<GenericApiResponse<Appointment>> {
        return this.http.patch<GenericApiResponse<Appointment>>(`${this.apiUrl}/${id}/complete`, { notes });
    }

    /**
     * Obtener la consulta actualmente en curso para el médico autenticado
     */
    getActiveConsultation(): Observable<GenericApiResponse<Appointment>> {
        return this.http.get<GenericApiResponse<Appointment>>(`${this.apiUrl}/active-consultation`);
    }

    /**
     * Iniciar formalmente la consulta de una cita
     */
    startAppointment(id: string): Observable<GenericApiResponse<Appointment>> {
        return this.http.patch<GenericApiResponse<Appointment>>(`${this.apiUrl}/${id}/start`, {});
    }

    /**
     * Actualizar una cita existente
     */
    updateAppointment(id: string, appointment: Partial<Appointment>): Observable<GenericApiResponse<Appointment>> {
        return this.http.patch<GenericApiResponse<Appointment>>(`${this.apiUrl}/${id}`, appointment);
    }

    /**
     * Reprogramar una cita existente (solo fecha/hora y duración)
     */
    rescheduleAppointment(id: string, startTime: string, durationMinutes: number): Observable<GenericApiResponse<Appointment>> {
        return this.http.patch<GenericApiResponse<Appointment>>(`${this.apiUrl}/${id}/reschedule`, {
            startTime,
            durationMinutes
        });
    }

    /**
     * Obtener las próximas citas del médico autenticado
     */
    getNextAppointments(date?: string, order: 'ASC' | 'DESC' = 'DESC'): Observable<GenericApiResponse<Appointment[]>> {
        let url = `${this.apiUrl}/next?order=${order}`;
        if (date) url += `&date=${date}`;
        return this.http.get<GenericApiResponse<Appointment[]>>(url);
    }

    /**
     * Obtener la siguiente cita de un paciente específico
     */
    getNextAppointmentByPatientId(patientId: string, date: string): Observable<GenericApiResponse<Appointment>> {
        return this.http.get<GenericApiResponse<Appointment>>(`${this.apiUrl}/patient/${patientId}/next?date=${date}`);
    }

    /**
     * Cancelar formalmente una cita con una razón específica
     */
    cancelAppointment(id: string, reason: string): Observable<GenericApiResponse<void>> {
        return this.http.patch<GenericApiResponse<void>>(`${this.apiUrl}/${id}/cancel`, { reason });
    }

    /**
     * Eliminar físicamente una cita
     */
    deleteAppointment(id: string): Observable<GenericApiResponse<void>> {
        return this.http.delete<GenericApiResponse<void>>(`${this.apiUrl}/${id}`);
    }
}

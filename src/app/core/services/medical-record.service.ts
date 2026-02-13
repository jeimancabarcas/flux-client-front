import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CreateMedicalRecordDto,
    MedicalRecord,
    MedicalRecordHistoryItem
} from '../models/medical-record.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class MedicalRecordService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/medical-records`;

    /**
     * Registrar una nueva historia clínica
     */
    registerMedicalRecord(record: CreateMedicalRecordDto): Observable<ApiResponse<MedicalRecord>> {
        return this.http.post<ApiResponse<MedicalRecord>>(this.apiUrl, record);
    }

    /**
     * Obtener el historial de historias clínicas de un paciente
     */
    getHistoryByPatient(patientId: string): Observable<ApiResponse<MedicalRecordHistoryItem[]>> {
        return this.http.get<ApiResponse<MedicalRecordHistoryItem[]>>(`${this.apiUrl}/patient/${patientId}`);
    }

    /**
     * Obtener la historia clínica asociada a una cita específica
     */
    getRecordByAppointment(appointmentId: string): Observable<ApiResponse<MedicalRecord | null>> {
        return this.http.get<ApiResponse<MedicalRecord | null>>(`${this.apiUrl}/appointment/${appointmentId}`);
    }
}

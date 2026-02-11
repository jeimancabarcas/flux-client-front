export enum AppointmentStatus {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    EN_CONSULTA = 'EN_CONSULTA',
    COMPLETADA = 'COMPLETADA',
    CANCELADA = 'CANCELADA'
}

export interface PatientInfo {
    id: string;
    nombres: string;
    apellidos: string;
    numeroIdentificacion: string;
    telefono: string;
}

export interface DoctorInfo {
    id: string;
    email: string;
    role: string;
    detalles?: {
        nombre: string;
        apellido: string;
    };
    details?: {
        nombre: string;
        apellido: string;
    };
}

import { CatalogItem } from './masters.model';

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
    status: AppointmentStatus;
    reason: string;
    notes: string | null;
    actualStartTime: string | null;
    actualEndTime: string | null;
    createdAt: string;
    updatedAt: string;
    patient?: PatientInfo;
    doctor?: DoctorInfo;
    itemIds?: string[]; // IDs del catálogo (CUPS/CUMS) para cargos pre-cargados
    items?: CatalogItem[]; // Objetos completos devueltos por algunos endpoints
}

export type CalendarView = 'day' | 'week' | 'month';

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

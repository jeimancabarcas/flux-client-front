import { Specialty } from './specialty.model';

export enum UserRole {
    ADMIN = 'ADMIN',
    MEDICO = 'MEDICO',
    RECEPCIONISTA = 'RECEPCIONISTA'
}

export interface UserDetails {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    direccionPrincipal: string;
    direccionSecundaria: string | null;
    telefono: string;
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    detalles: UserDetails | null; // Sincronizado con el backend (detalles en español)
    specialties: Specialty[];    // Nodo de especialidades asignadas
    deletedAt: string | null;
}

export interface LoginRequest {
    email: string;
    password: string;
}

// Standardized API Response format
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

// Login response data
export interface LoginResponseData {
    access_token: string;
    user: User;
}

// Complete login response
export type LoginResponse = ApiResponse<LoginResponseData>;

import { ApiResponse } from './user.model';

export interface Specialty {
    id: string;
    name: string;      // Sincronizado con el backend
    description: string | null; // Sincronizado con el backend
    activo?: boolean;  // Opcional si no viene en esta respuesta específica
    createdAt?: string;
    updatedAt?: string;
}

export type SpecialtyResponse = ApiResponse<Specialty>;
export type SpecialtyListResponse = ApiResponse<Specialty[]>;

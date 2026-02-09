export interface Patient {
    id: string;
    nombres: string;
    apellidos: string;
    tipoIdentificacion: string;
    numeroIdentificacion: string;
    fechaNacimiento: string;
    genero: string;
    email: string;
    telefono: string;
    direccion: string;
    habeasDataConsent: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedPatients {
    data: Patient[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

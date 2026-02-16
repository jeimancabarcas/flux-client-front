export enum RdaType {
    PACIENTE = 'PACIENTE',
    HOSPITALIZACION = 'HOSPITALIZACION',
    CONSULTA_EXTERNA = 'CONSULTA_EXTERNA',
    URGENCIAS = 'URGENCIAS'
}

export interface Diagnosis {
    code: string;
    description: string;
    type: 'PRINCIPAL' | 'RELACIONADO' | 'COMPLICACION';
}

export interface Medication {
    cum: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export interface Procedure {
    code: string;
    description: string;
}

export interface ClinicalRecordRDA {
    id?: string;
    appointmentId: string;
    patientId: string;
    doctorId: string;
    type: RdaType;

    // Motivo de consulta y enfermedad actual
    reasonForConsultation: string;
    currentIllness: string;

    // Antecedentes
    medicalHistory?: string;
    surgicalHistory?: string;
    allergicHistory?: string;
    familyHistory?: string;

    // Examen físico
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        respiratoryRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
        bmi?: number;
    };
    physicalExamination: string;

    // Diagnósticos y conducta
    diagnoses: Diagnosis[];
    medications: Medication[];

    planAndTreatment: string;
    recommendations: string;

    createdAt?: string;
    updatedAt?: string;
}

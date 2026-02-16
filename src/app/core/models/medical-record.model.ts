import { Diagnosis } from './rda.model';

export interface PediatricExtension {
    weight: number;
    height: number;
    cephalicPerimeter: number;
    abdominalPerimeter: number;
    perinatalHistory: string;
}

export interface PatientBackground {
    pathological?: string;
    surgical?: string;
    allergic?: string;
    pharmacological?: string;
    familyHistory?: string;
    reviewOfSystems?: string;
}

export interface PhysicalExamination {
    content: string;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    systolicBloodPressure?: number;
    diastolicBloodPressure?: number;
    weight?: number;
    height?: number;
}

export interface Prescription {
    cum: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export interface CreateMedicalRecordDto {
    appointmentId: string;
    patientId: string;
    reason: string;
    currentIllness: string;
    physicalExamination: PhysicalExamination;
    diagnoses: Diagnosis[];
    prescriptions: Prescription[];
    plan: string;
    pediatricExtension?: PediatricExtension;
    patientBackground?: PatientBackground;
}

export interface MedicalRecord {
    id: string;
    appointmentId: string;
    patientId: string;
    doctorId: string;
    reason: string;
    currentIllness: string;
    physicalExamination: PhysicalExamination;
    diagnoses: Diagnosis[];
    prescriptions: Prescription[];
    plan: string;
    pediatricExtension?: PediatricExtension;
    patientBackground?: PatientBackground;
    createdAt: string;
    updatedAt: string;
}

export interface MedicalRecordHistoryItem {
    id: string;
    doctorId?: string;
    reason: string;
    currentIllness: string;
    diagnoses: string[];
    createdAt: string;
    pediatricExtension?: PediatricExtension | null;
    patientBackground?: PatientBackground | null;
    physicalExamination?: PhysicalExamination | null;
}

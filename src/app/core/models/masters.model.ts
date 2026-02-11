export interface MasterItem {
    id: string;
    name: string;
    isActive: boolean;
}

export type Eps = MasterItem;
export type Prepagada = MasterItem;

export interface CatalogItem {
    id: string;
    code: string;
    name: string;
    type: 'SERVICE' | 'PRODUCT';
    price: number;
    isActive: boolean;
    stock?: number | null;
}

export interface Agreement {
    id: string;
    productServiceId: string;
    prepagadaId: string;
    patientAmount: number;
    entityAmount: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    // Campos opcionales para visualización (relaciones cargadas)
    productService?: CatalogItem;
    prepagada?: Prepagada;
}

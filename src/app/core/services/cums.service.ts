import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CumMedication {
    id: string;
    expediente: string;
    producto: string;
    titular: string;
    registroSanitario: string;
    principioActivo: string;
    concentracion: string;
    formaFarmaceutica: string;
    atc: string;
    descripcionAtc: string;
    viaAdministracion: string;
    descripcionComercial: string;
}

@Injectable({
    providedIn: 'root'
})
export class CumsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/cums`;

    search(term: string): Observable<{ success: boolean, data: CumMedication[] }> {
        return this.http.get<{ success: boolean, data: CumMedication[] }>(`${this.apiUrl}/search`, {
            params: { term }
        });
    }
}

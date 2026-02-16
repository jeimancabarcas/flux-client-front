import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IcdDiagnosis } from '../models/icd.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class IcdService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/icd`;

    /**
     * Buscar diagnósticos CIE-11 por texto
     * @param query Término de búsqueda
     * @returns Observable con el arreglo de diagnósticos
     */
    searchDiagnoses(query: string): Observable<IcdDiagnosis[]> {
        const payload = {
            q: query,
            chapterFilter: "10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;01;02;03;04;05;06;07;08;09;V;X;",
            includePostcoordination: true,
            useFlexiSearch: false,
            flatResults: true,
            medicalCodingMode: true
        };

        return this.http.post<any>(`${this.apiUrl}/search`, payload).pipe(
            map(response => {
                // The backend now returns the full WHO API response
                // Extracting from destinationEntities which is standard for ICD-11 search
                const data = response.data || response;
                const entities = data.destinationEntities || [];

                return entities.map((entity: any) => ({
                    code: entity.theCode || 'N/A',
                    description: entity.title?.replace(/<[^>]*>/g, '') || 'Sin descripción', // Strip HTML tags if any
                    score: entity.score || 0
                })).filter((diag: IcdDiagnosis) => diag.code !== 'N/A');
            })
        );
    }
}

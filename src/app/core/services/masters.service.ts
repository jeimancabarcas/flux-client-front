import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Eps, Prepagada, CatalogItem, Agreement } from '../models/masters.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class MastersService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/masters`;

    // EPS Methods
    getEpsList(): Observable<ApiResponse<Eps[]>> {
        return this.http.get<ApiResponse<Eps[]>>(`${this.apiUrl}/eps`);
    }

    createEps(data: Partial<Eps>): Observable<ApiResponse<Eps>> {
        return this.http.post<ApiResponse<Eps>>(`${this.apiUrl}/eps`, data);
    }

    updateEps(id: string, data: Partial<Eps>): Observable<ApiResponse<Eps>> {
        return this.http.patch<ApiResponse<Eps>>(`${this.apiUrl}/eps/${id}`, data);
    }

    deleteEps(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/eps/${id}`);
    }

    // Prepagada Methods
    getPrepagadaList(): Observable<ApiResponse<Prepagada[]>> {
        return this.http.get<ApiResponse<Prepagada[]>>(`${this.apiUrl}/prepagada`);
    }

    createPrepagada(data: Partial<Prepagada>): Observable<ApiResponse<Prepagada>> {
        return this.http.post<ApiResponse<Prepagada>>(`${this.apiUrl}/prepagada`, data);
    }

    updatePrepagada(id: string, data: Partial<Prepagada>): Observable<ApiResponse<Prepagada>> {
        return this.http.patch<ApiResponse<Prepagada>>(`${this.apiUrl}/prepagada/${id}`, data);
    }

    deletePrepagada(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/prepagada/${id}`);
    }

    // Catalog Methods (CUPS/CUMS)
    getCatalog(): Observable<ApiResponse<CatalogItem[]>> {
        return this.http.get<ApiResponse<CatalogItem[]>>(`${this.apiUrl}/catalog`);
    }

    createCatalogItem(data: Partial<CatalogItem>): Observable<ApiResponse<CatalogItem>> {
        return this.http.post<ApiResponse<CatalogItem>>(`${this.apiUrl}/catalog`, data);
    }

    updateCatalogItem(id: string, data: Partial<CatalogItem>): Observable<ApiResponse<CatalogItem>> {
        return this.http.patch<ApiResponse<CatalogItem>>(`${this.apiUrl}/catalog/${id}`, data);
    }

    deleteCatalogItem(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/catalog/${id}`);
    }

    searchCatalog(term: string): Observable<ApiResponse<CatalogItem[]>> {
        return this.http.get<ApiResponse<CatalogItem[]>>(`${this.apiUrl}/catalog/search?term=${term}`);
    }

    // Agreements Methods
    getAgreements(prepagadaId?: string, isActive?: boolean): Observable<ApiResponse<Agreement[]>> {
        let url = `${this.apiUrl}/agreements`;
        const params: string[] = [];
        if (prepagadaId) params.push(`prepagadaId=${prepagadaId}`);
        if (isActive !== undefined) params.push(`isActive=${isActive}`);

        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        return this.http.get<ApiResponse<Agreement[]>>(url);
    }

    createAgreement(data: Partial<Agreement>): Observable<ApiResponse<Agreement>> {
        return this.http.post<ApiResponse<Agreement>>(`${this.apiUrl}/agreements`, data);
    }

    updateAgreement(id: string, data: Partial<Agreement>): Observable<ApiResponse<Agreement>> {
        return this.http.put<ApiResponse<Agreement>>(`${this.apiUrl}/agreements/${id}`, data);
    }

    deleteAgreement(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/agreements/${id}`);
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Eps, Prepagada } from '../models/masters.model';
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
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ApiResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/users`;

    /**
     * Obtener todos los usuarios (Solo Admin)
     */
    getUsers(): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(this.apiUrl);
    }

    /**
     * Obtener un usuario por ID
     */
    getUserById(id: string): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crear nuevo usuario
     */
    createUser(userData: Partial<User>): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(this.apiUrl, userData);
    }

    /**
     * Actualizar usuario existente
     */
    updateUser(id: string, userData: Partial<User>): Observable<ApiResponse<User>> {
        return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${id}`, userData);
    }

    /**
     * Eliminar usuario
     */
    deleteUser(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Actualizar perfil del usuario autenticado
     */
    updateProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
        return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/profile`, userData);
    }

    /**
     * Obtener todos los doctores
     */
    getDoctors(): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/doctors`);
    }
}

import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        canActivate: [loginGuard],
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'appointments',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'admin/users',
        canActivate: [authGuard],
        loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent)
    },
    {
        path: 'admin/specialties',
        canActivate: [authGuard],
        loadComponent: () => import('./features/admin/specialty-management/specialty-management.component').then(m => m.SpecialtyManagementComponent)
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];

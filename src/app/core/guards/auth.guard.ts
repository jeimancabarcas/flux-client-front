import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Guard to protect routes that require authentication and completed profile
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login']);
    }

    const user = authService.currentUser();

    // Si no es ADMIN y no tiene detalles, debe ir al onboarding
    if (user && user.role !== UserRole.ADMIN && !user.detalles) {
        return router.createUrlTree(['/onboarding']);
    }

    return true;
};

/**
 * Guard to prevent authenticated users from accessing login page
 */
export const loginGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    const user = authService.currentUser();

    // Si ya está autenticado pero no tiene detalles, onboarding
    if (user && user.role !== UserRole.ADMIN && !user.detalles) {
        return router.createUrlTree(['/onboarding']);
    }

    return router.createUrlTree(['/dashboard']);
};

/**
 * Guard specific for onboarding completion
 */
export const onboardingGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login']);
    }

    const user = authService.currentUser();

    // Si ya tiene detalles o es admin, no necesita onboarding
    if (user && (user.role === UserRole.ADMIN || user.detalles)) {
        return router.createUrlTree(['/dashboard']);
    }

    return true;
};

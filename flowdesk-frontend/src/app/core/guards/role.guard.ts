import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export type AppRole = 'ADMIN' | 'MANAGER' | 'USER';

// ── roleGuard ─────────────────────────────────────────
// ใช้งาน: canActivate: [authGuard, roleGuard('ADMIN')]
// หรือหลาย role: canActivate: [authGuard, roleGuard('ADMIN', 'MANAGER')]
export const roleGuard = (...allowedRoles: AppRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();

    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const hasRole = allowedRoles.includes(user.role as AppRole);
    if (!hasRole) {
      // redirect ไป dashboard แทน (ไม่ให้รู้ว่า route มีอยู่)
      router.navigate(['/dashboard']);
      return false;
    }

    return true;
  };
};

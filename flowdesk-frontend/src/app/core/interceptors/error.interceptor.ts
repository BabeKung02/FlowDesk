import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {

      // ── 429 Too Many Requests ──────────────────────
      if (err.status === 429) {
        const message =
          err?.error?.message || 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
        return throwError(() => ({ ...err, error: { message } }));
      }

      // ── 401 Unauthorized → ลอง refresh token ───────
      if (err.status === 401 && !isRefreshing && !req.url.includes('/refresh-token')) {
        isRefreshing = true;

        return authService.refreshAccessToken().pipe(
          switchMap((res) => {
            isRefreshing = false;

            // retry request เดิมด้วย accessToken ใหม่
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            isRefreshing = false;

            // refresh ล้มเหลว → logout และ redirect login
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => err);
    })
  );
};

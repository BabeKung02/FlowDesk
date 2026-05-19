import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err) => {
      if (err.status === 429) {
        // อ่านจาก Backend response ที่ส่งมา
        const message = err?.error?.message
          || 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';

        err = { ...err, error: { message } };
      }
      return throwError(() => err);
    })
  );
};
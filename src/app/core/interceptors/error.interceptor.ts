import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError(err => {
      // Skip generic toasts for specific auth-related requests so components can show better messages
      const isAuthRequest = req.url.includes('/api/v1/auth/');

      if (err.status === 0) {
        toast.error('Cannot connect to server. Check your connection.');
      } else if (err.status >= 500) {
        if (!isAuthRequest) toast.error(`Server error (${err.status}). Please try again.`);
      } else if (err.status === 403) {
        if (!isAuthRequest) toast.error('You do not have permission to perform this action.');
      } else if (err.status === 404) {
        if (!isAuthRequest) toast.error('Resource not found.');
      }
      return throwError(() => err);
    })
  );
};

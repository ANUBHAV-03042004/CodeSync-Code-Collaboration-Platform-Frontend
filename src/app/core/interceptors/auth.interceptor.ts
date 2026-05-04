import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { filter, take } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Wait for any in-progress navigation to finish before redirecting.
        // This prevents the InvalidStateError caused by two concurrent navigations.
        const nav = router.getCurrentNavigation();
        if (nav) {
          // A navigation is already in progress — wait for it to complete first
          router.events.pipe(
            filter(e => e instanceof NavigationStart),
            take(1)
          ).subscribe(() => router.navigate(['/login']));
        } else {
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
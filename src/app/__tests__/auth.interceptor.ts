import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { filter, take } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token  = localStorage.getItem('access_token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        const nav = router.getCurrentNavigation();
        if (nav) {
          // FIX: was NavigationStart — that fires at the START of the NEXT navigation,
          // meaning the /login redirect silently never fired while a navigation was active.
          // NavigationEnd | NavigationCancel | NavigationError waits for the CURRENT
          // navigation to finish before redirecting.
          router.events.pipe(
            filter(e => e instanceof NavigationEnd
                     || e instanceof NavigationCancel
                     || e instanceof NavigationError),
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
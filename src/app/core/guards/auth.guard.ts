import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // FIX: also reject expired tokens so the dashboard never fires API calls
  // with a stale Bearer that will 401 on every request.
  try {
    const payload   = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp && (payload.exp * 1000) < Date.now();
    if (isExpired) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      router.navigate(['/login']);
      return false;
    }
  } catch { /* malformed token — let the interceptor handle the 401 */ }

  return true;
};
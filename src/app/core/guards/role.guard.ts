import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
// role
function decodeJwtPayload(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}


export const roleGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  if (!token) { router.navigate(['/login']); return false; }

  const payload = decodeJwtPayload(token);
  const role: string = payload?.role || payload?.roles?.[0] || '';
  if (role !== 'ADMINISTRATOR' && !role.includes('ADMIN')) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

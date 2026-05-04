import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User, SessionStatus } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // ── All /api/v1/auth/** routes → gateway → auth-service (no JwtAuthFilter on this route)
  private base = `${environment.apiBase}/api/v1/auth`;

  // ── Registration / Login / Logout ──────────────────────────────────────────
  // POST /api/v1/auth/register
  register(username: string, email: string, password: string, fullName: string): Observable<any> {
    return this.http.post(`${this.base}/register`, { username, email, password, fullName });
  }

  // POST /api/v1/auth/login
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  // POST /api/v1/auth/logout  (interceptor injects Bearer token)
  logout(): Observable<any> {
    return this.http.post(`${this.base}/logout`, {}).pipe(
      tap(() => this.clearStorage())
    );
  }

  // ── Token ops ──────────────────────────────────────────────────────────────
  // POST /api/v1/auth/refresh
  refresh(): Observable<{ accessToken: string; tokenType: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<{ accessToken: string; tokenType: string }>(
      `${this.base}/refresh`, { refreshToken }
    ).pipe(tap(res => localStorage.setItem('access_token', res.accessToken)));
  }

  // POST /api/v1/auth/validate
  validate(token: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.base}/validate`, { token });
  }

  // ── Session ────────────────────────────────────────────────────────────────
  // GET /api/v1/auth/session/status
  sessionStatus(): Observable<SessionStatus> {
    return this.http.get<SessionStatus>(`${this.base}/session/status`);
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  // GET /api/v1/auth/profile
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/profile`);
  }

  // PUT /api/v1/auth/profile
  updateProfile(data: Partial<Pick<User, 'username' | 'fullName' | 'bio' | 'avatarUrl'>>): Observable<User> {
    return this.http.put<User>(`${this.base}/profile`, data);
  }

  // PUT /api/v1/auth/password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.base}/password`, { currentPassword, newPassword });
  }

  // ── Search / Lookup ────────────────────────────────────────────────────────
  // GET /api/v1/auth/search?q=...
  searchUsers(q: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/search`, { params: { q } });
  }

  // GET /api/v1/auth/{userId}
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${userId}`);
  }

  // ── Account lifecycle ──────────────────────────────────────────────────────
  // POST /api/v1/auth/deactivate
  deactivateAccount(): Observable<any> {
    return this.http.post(`${this.base}/deactivate`, {});
  }

  // ── Password reset ─────────────────────────────────────────────────────────
  // POST /api/v1/auth/forgot-password
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.base}/forgot-password`, { email });
  }

  // GET /api/v1/auth/reset-password/validate?token=...
  validateResetToken(token: string): Observable<{ valid: boolean; message: string }> {
    return this.http.get<{ valid: boolean; message: string }>(
      `${this.base}/reset-password/validate`, { params: { token } }
    );
  }

  // POST /api/v1/auth/reset-password
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.base}/reset-password`, { token, newPassword });
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  // GET /api/v1/auth/admin/users
  adminGetAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/users`);
  }
  // Keep legacy alias used in some components
  getAllUsers(): Observable<User[]> {
    return this.adminGetAllUsers();
  }

  // PUT /api/v1/auth/admin/users/{userId}/reactivate
  adminReactivate(userId: number): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${userId}/reactivate`, {});
  }
  // Keep legacy alias
  reactivateUser(userId: number): Observable<any> {
    return this.adminReactivate(userId);
  }

  // DELETE /api/v1/auth/admin/users/{userId}
  adminDeleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/users/${userId}`);
  }
  // Keep legacy alias
  deleteUser(userId: number): Observable<any> {
    return this.adminDeleteUser(userId);
  }

  // ── OAuth2 ─────────────────────────────────────────────────────────────────
  // Gateway route: /oauth2/** → auth-service (auth-oauth2 route, StripPrefix=0)
  // Correct path: /oauth2/authorization/github  (NOT /api/v1/auth/oauth2/...)
  loginWithGithub(): void {
    window.location.href = `${environment.apiBase}/oauth2/authorization/github`;
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiBase}/oauth2/authorization/google`;
  }

  // Convenience URL getters for use in templates (anchor href)
  get githubOAuthUrl(): string {
    return `${environment.apiBase}/oauth2/authorization/github`;
  }

  get googleOAuthUrl(): string {
    return `${environment.apiBase}/oauth2/authorization/google`;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getCurrentUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

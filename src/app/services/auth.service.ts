import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User, SessionStatus } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/v1/auth`;

  // ── Auth ──────────────────────────────────────────────────────────────────
  register(username: string, email: string, password: string, fullName: string): Observable<any> {
    return this.http.post(`${this.base}/register`, { username, email, password, fullName });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.base}/logout`, {}).pipe(
      tap(() => this.clearStorage())
    );
  }

  refresh(): Observable<{ accessToken: string; tokenType: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<{ accessToken: string; tokenType: string }>(
      `${this.base}/refresh`, { refreshToken }
    ).pipe(tap(res => localStorage.setItem('access_token', res.accessToken)));
  }

  validate(token: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.base}/validate`, { token });
  }

  // ── Session ───────────────────────────────────────────────────────────────
  sessionStatus(): Observable<SessionStatus> {
    return this.http.get<SessionStatus>(`${this.base}/session/status`);
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/profile`);
  }

  updateProfile(data: Partial<Pick<User, 'username' | 'fullName' | 'bio' | 'avatarUrl'>>): Observable<User> {
    return this.http.put<User>(`${this.base}/profile`, data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.base}/password`, { currentPassword, newPassword });
  }

  // ── Search / Lookup ───────────────────────────────────────────────────────
  searchUsers(q: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/search`, { params: { q } });
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${userId}`);
  }

  // ── Account lifecycle ─────────────────────────────────────────────────────
  deactivateAccount(): Observable<any> {
    return this.http.post(`${this.base}/deactivate`, {});
  }

  // ── Password reset ────────────────────────────────────────────────────────
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.base}/forgot-password`, { email });
  }

  validateResetToken(token: string): Observable<{ valid: boolean; message: string }> {
    return this.http.get<{ valid: boolean; message: string }>(
      `${this.base}/reset-password/validate`, { params: { token } }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.base}/reset-password`, { token, newPassword });
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  adminGetAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/users`);
  }

  adminReactivate(userId: number): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${userId}/reactivate`, {});
  }

  adminDeleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/users/${userId}`);
  }

  // ── OAuth ─────────────────────────────────────────────────────────────────
  loginWithGoogle(): void {
    window.location.href = `${this.base}/oauth2/authorize/google`;
  }

  loginWithGithub(): void {
    window.location.href = `${this.base}/oauth2/authorize/github`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
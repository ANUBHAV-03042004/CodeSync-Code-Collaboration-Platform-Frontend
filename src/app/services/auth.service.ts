import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User, SessionStatus } from '../core/models';
// AuthService: Angular service coordinating user login, session caching, profiles, and OAuth redirections.
//

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private base = `${environment.apiBase}/api/v1/auth`;

  register(username: string, email: string, password: string, fullName: string, role?: string, adminSecret?: string): Observable<any> {
    return this.http.post(`${this.base}/register`, { username, email, password, fullName, role, adminSecret });
  }

  guestLogin(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/guest-login`, {}).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user || { username: 'Guest', role: 'GUEST' }));
      })
    );
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

  sessionStatus(): Observable<SessionStatus> {
    return this.http.get<SessionStatus>(`${this.base}/session/status`);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/profile`);
  }

  updateProfile(data: Partial<Pick<User, 'username' | 'fullName' | 'bio' | 'avatarUrl'>>): Observable<User> {
    return this.http.put<User>(`${this.base}/profile`, data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.base}/password`, { currentPassword, newPassword });
  }

  searchUsers(q: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/search`, { params: { q } });
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${userId}`);
  }

  deactivateAccount(): Observable<any> {
    return this.http.post(`${this.base}/deactivate`, {});
  }

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

  adminGetAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/users`);
  }
  
  getAllUsers(): Observable<User[]> {
    return this.adminGetAllUsers();
  }

  adminReactivate(userId: number): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${userId}/reactivate`, {});
  }
  
  reactivateUser(userId: number): Observable<any> {
    return this.adminReactivate(userId);
  }

  adminDeleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/users/${userId}`);
  }
  
  deleteUser(userId: number): Observable<any> {
    return this.adminDeleteUser(userId);
  }

  loginWithGithub(): void {
    window.location.href = `${environment.apiBase}/oauth2/authorization/github`;
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiBase}/oauth2/authorization/google`;
  }

  get githubOAuthUrl(): string {
    return `${environment.apiBase}/oauth2/authorization/github`;
  }

  get googleOAuthUrl(): string {
    return `${environment.apiBase}/oauth2/authorization/google`;
  }

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
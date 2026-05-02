import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiBase}/api/v1/auth`;

const mockUser = {
  userId: 1, username: 'testuser', email: 'test@example.com',
  fullName: 'Test User', role: 'USER' as const, avatarUrl: '', bio: '',
  provider: 'LOCAL' as const, isActive: true, createdAt: '2024-01-01'
};

const mockAuthResponse = {
  accessToken: 'access-jwt', refreshToken: 'refresh-jwt',
  tokenType: 'Bearer', user: mockUser
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  // ── register ──────────────────────────────────────────────────────────────
  it('should POST /register', () => {
    service.register('user', 'user@x.com', 'pass1234', 'User').subscribe();
    const req = http.expectOne(`${BASE}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'user', email: 'user@x.com', password: 'pass1234', fullName: 'User' });
    req.flush({ message: 'ok', user: mockUser });
  });

  // ── login ─────────────────────────────────────────────────────────────────
  it('should POST /login and store tokens', () => {
    service.login('test@example.com', 'pass1234').subscribe(res => {
      expect(res.accessToken).toBe('access-jwt');
    });
    const req = http.expectOne(`${BASE}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(localStorage.getItem('access_token')).toBe('access-jwt');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-jwt');
  });

  // ── logout ────────────────────────────────────────────────────────────────
  it('should POST /logout and clear storage', () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    service.logout().subscribe();
    const req = http.expectOne(`${BASE}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Logged out successfully' });
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  // ── refresh ───────────────────────────────────────────────────────────────
  it('should POST /refresh and update access token', () => {
    localStorage.setItem('refresh_token', 'old-refresh');
    service.refresh().subscribe(res => {
      expect(res.accessToken).toBe('new-access');
    });
    const req = http.expectOne(`${BASE}/refresh`);
    req.flush({ accessToken: 'new-access', tokenType: 'Bearer' });
    expect(localStorage.getItem('access_token')).toBe('new-access');
  });

  // ── validate ──────────────────────────────────────────────────────────────
  it('should POST /validate', () => {
    service.validate('some-token').subscribe(res => expect(res.valid).toBe(true));
    const req = http.expectOne(`${BASE}/validate`);
    req.flush({ valid: true });
  });

  // ── getProfile ────────────────────────────────────────────────────────────
  it('should GET /profile', () => {
    service.getProfile().subscribe(u => expect(u.userId).toBe(1));
    const req = http.expectOne(`${BASE}/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  // ── updateProfile ─────────────────────────────────────────────────────────
  it('should PUT /profile', () => {
    service.updateProfile({ fullName: 'New Name' }).subscribe();
    const req = http.expectOne(`${BASE}/profile`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockUser);
  });

  // ── changePassword ────────────────────────────────────────────────────────
  it('should PUT /password', () => {
    service.changePassword('old', 'newpass1').subscribe();
    const req = http.expectOne(`${BASE}/password`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'ok' });
  });

  // ── searchUsers ───────────────────────────────────────────────────────────
  it('should GET /search with query', () => {
    service.searchUsers('test').subscribe();
    const req = http.expectOne(`${BASE}/search?q=test`);
    expect(req.request.method).toBe('GET');
    req.flush([mockUser]);
  });

  // ── getUserById ───────────────────────────────────────────────────────────
  it('should GET /:userId', () => {
    service.getUserById(1).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    req.flush(mockUser);
  });

  // ── forgotPassword ────────────────────────────────────────────────────────
  it('should POST /forgot-password', () => {
    service.forgotPassword('u@x.com').subscribe();
    const req = http.expectOne(`${BASE}/forgot-password`);
    expect(req.request.body).toEqual({ email: 'u@x.com' });
    req.flush({ message: 'sent' });
  });

  // ── validateResetToken ────────────────────────────────────────────────────
  it('should GET /reset-password/validate', () => {
    service.validateResetToken('tok123').subscribe();
    const req = http.expectOne(`${BASE}/reset-password/validate?token=tok123`);
    req.flush({ valid: true, message: 'Token is valid' });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────
  it('should POST /reset-password', () => {
    service.resetPassword('tok', 'newpass1').subscribe();
    const req = http.expectOne(`${BASE}/reset-password`);
    expect(req.request.body).toEqual({ token: 'tok', newPassword: 'newpass1' });
    req.flush({ message: 'ok' });
  });

  // ── admin endpoints ───────────────────────────────────────────────────────
  it('should GET /admin/users', () => {
    service.adminGetAllUsers().subscribe();
    const req = http.expectOne(`${BASE}/admin/users`);
    req.flush([mockUser]);
  });

  it('should PUT /admin/users/:id/reactivate', () => {
    service.adminReactivate(5).subscribe();
    const req = http.expectOne(`${BASE}/admin/users/5/reactivate`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'ok' });
  });

  it('should DELETE /admin/users/:id', () => {
    service.adminDeleteUser(5).subscribe();
    const req = http.expectOne(`${BASE}/admin/users/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── helpers ───────────────────────────────────────────────────────────────
  it('isLoggedIn returns true when token exists', () => {
    localStorage.setItem('access_token', 'tok');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('isLoggedIn returns false when no token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('getCurrentUser returns null when no user in storage', () => {
    expect(service.getCurrentUser()).toBeNull();
  });

  it('getCurrentUser parses user from localStorage', () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    expect(service.getCurrentUser()?.userId).toBe(1);
  });

  it('clearStorage removes all tokens', () => {
    localStorage.setItem('access_token', 'a');
    localStorage.setItem('refresh_token', 'b');
    localStorage.setItem('user', '{}');
    service.clearStorage();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

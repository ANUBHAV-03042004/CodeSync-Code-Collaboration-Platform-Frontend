import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { authInterceptor } from '../../core/interceptors/auth.interceptor';

// ── Mock activation context helper ────────────────────────────────────────────
function runGuard(guard: any): boolean | any {
  return TestBed.runInInjectionContext(() => guard({} as any, {} as any));
}

// ── AuthGuard ──────────────────────────────────────────────────────────────────
describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'login', component: class {} as any }])]
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should return true when token exists', () => {
    localStorage.setItem('access_token', 'valid-jwt');
    expect(runGuard(authGuard)).toBe(true);
  });

  it('should return false and navigate to /login when no token', () => {
    const spy = jest.spyOn(router, 'navigate');
    const result = runGuard(authGuard);
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/login']);
  });
});

// ── RoleGuard ──────────────────────────────────────────────────────────────────
describe('roleGuard', () => {
  let router: Router;

  const makeToken = (role: string): string => {
    const payload = btoa(JSON.stringify({ sub: 'user@test.com', role }));
    return `header.${payload}.signature`;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'dashboard', component: class {} as any }])]
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should return true for ADMIN role', () => {
    localStorage.setItem('access_token', makeToken('ADMIN'));
    expect(runGuard(roleGuard)).toBe(true);
  });

  it('should return false and navigate to /dashboard for USER role', () => {
    const spy = jest.spyOn(router, 'navigate');
    localStorage.setItem('access_token', makeToken('USER'));
    const result = runGuard(roleGuard);
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should return false when no token', () => {
    const spy = jest.spyOn(router, 'navigate');
    const result = runGuard(roleGuard);
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});

// ── AuthInterceptor ────────────────────────────────────────────────────────────
describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // FIX: provideHttpClientTesting must be paired with provideHttpClient.
        // Using HttpClientTestingModule alone doesn't register HttpTestingController
        // when the interceptor is registered via provideHttpClient(withInterceptors([...])).
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: class {} as any }])
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => { controller.verify(); localStorage.clear(); });

  it('should attach Bearer token when token exists', () => {
    localStorage.setItem('access_token', 'my-token');
    http.get('/api/test').subscribe();
    const req = controller.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({});
  });

  it('should NOT attach Authorization header when no token', () => {
    http.get('/api/test').subscribe();
    const req = controller.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should clear tokens and redirect on 401', () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate');

    http.get('/api/protected').subscribe({ error: () => {} });
    const req = controller.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(spy).toHaveBeenCalledWith(['/login']);
  });
});

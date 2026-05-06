import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  Oauth2CallbackComponent,
  ForgotPasswordComponent,
  ResetPasswordComponent
} from '../features/auth/auth-extra.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../shared/components/toast/toast.service';

jest.mock('gsap', () => {
  const chain: any = {};
  chain.fromTo = jest.fn().mockReturnValue(chain);
  chain.to = jest.fn().mockReturnValue(chain);
  const gspInstance = { fromTo: jest.fn(), to: jest.fn(), timeline: jest.fn(() => chain) };
  return { ...gspInstance, gsap: gspInstance, default: gspInstance };
});

const createAuthMock = () => ({
  forgotPassword: jest.fn().mockReturnValue(of({})),
  validateResetToken: jest.fn().mockReturnValue(of({ valid: true, message: 'ok' })),
  resetPassword: jest.fn().mockReturnValue(of({})),
  clearStorage: jest.fn()
});

const createToastMock = () => ({
  success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), toast$: of()
});

const makeJwt = (payload: object) => `header.${btoa(JSON.stringify(payload))}.sig`;

// ── Oauth2CallbackComponent ────────────────────────────────────────────────────
describe('Oauth2CallbackComponent', () => {
  let router: Router;

  // Sets window.location.hash to simulate the fragment the backend sends:
  //   /oauth2/callback#token=xxx&refreshToken=yyy
  const setupWith = async (tokenValue: string | null) => {
    await TestBed.resetTestingModule();

    // Set the URL fragment BEFORE the component initialises
    if (tokenValue) {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: `#token=${tokenValue}&refreshToken=refresh-token` },
        writable: true
      });
    } else {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: '' },
        writable: true
      });
    }

    // FIX: Oauth2CallbackComponent now injects AuthService (for getProfile()).
    // AuthService needs HttpClient -> must provide HttpClientTestingModule,
    // OR provide a mock AuthService so no real HttpClient is needed.
    const authMock = {
      getProfile: jest.fn().mockReturnValue(of({ userId: 1, email: 'user@test.com', role: 'USER' }))
    };
    await TestBed.configureTestingModule({
      imports: [Oauth2CallbackComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(Oauth2CallbackComponent);
    router = TestBed.inject(Router);
    localStorage.clear();
    return fixture;
  };

  afterEach(() => {
    localStorage.clear();
    // Reset hash after each test
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '' },
      writable: true
    });
  });

  it('should create', async () => {
    const fixture = await setupWith(makeJwt({ sub: 'user@test.com', role: 'USER' }));
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should store token in localStorage when token is present', async () => {
    const fixture = await setupWith(makeJwt({ sub: 'user@test.com', role: 'USER' }));
    fixture.detectChanges();
    expect(localStorage.getItem('access_token')).toBeTruthy();
  });

  it('should navigate to /dashboard on success', async () => {
    const fixture = await setupWith(makeJwt({ sub: 'user@test.com', role: 'USER' }));
    const spy = jest.spyOn(router, 'navigate');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /login with error when no token', async () => {
    const fixture = await setupWith(null);
    const spy = jest.spyOn(router, 'navigate');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/login'], { queryParams: { error: 'oauth_failed' } });
  });
});

// ── ForgotPasswordComponent ────────────────────────────────────────────────────
describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authSvc: ReturnType<typeof createAuthMock>;
  let toastSvc: ReturnType<typeof createToastMock>;

  beforeEach(async () => {
    authSvc = createAuthMock();
    toastSvc = createToastMock();

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: ToastService, useValue: toastSvc }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should have invalid form with no email', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should have invalid form with bad email', () => {
    component.form.patchValue({ email: 'notanemail' });
    expect(component.form.invalid).toBe(true);
  });

  it('should not submit if form invalid', () => {
    component.onSubmit();
    expect(authSvc.forgotPassword).not.toHaveBeenCalled();
  });

  it('should call forgotPassword with email', () => {
    component.form.patchValue({ email: 'user@example.com' });
    component.onSubmit();
    expect(authSvc.forgotPassword).toHaveBeenCalledWith('user@example.com');
  });

  it('should set sent=true after success', () => {
    component.form.patchValue({ email: 'user@example.com' });
    component.onSubmit();
    expect(component.sent).toBe(true);
  });

  it('should show success toast after success', () => {
    component.form.patchValue({ email: 'user@example.com' });
    component.onSubmit();
    expect(toastSvc.success).toHaveBeenCalledWith('Reset link sent!');
  });

  it('should show error toast on failure', () => {
    authSvc.forgotPassword.mockReturnValue(throwError(() => new Error()));
    component.form.patchValue({ email: 'user@example.com' });
    component.onSubmit();
    expect(toastSvc.error).toHaveBeenCalled();
  });

  it('should set loading=false after error', () => {
    authSvc.forgotPassword.mockReturnValue(throwError(() => new Error()));
    component.form.patchValue({ email: 'user@example.com' });
    component.onSubmit();
    expect(component.loading).toBe(false);
  });
});

// ── ResetPasswordComponent ─────────────────────────────────────────────────────
describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authSvc: ReturnType<typeof createAuthMock>;
  let toastSvc: ReturnType<typeof createToastMock>;
  let router: Router;

  const setupWith = async (tokenValue: string | null, authOverride?: Partial<ReturnType<typeof createAuthMock>>) => {
    const auth = { ...createAuthMock(), ...authOverride };
    const toast = createToastMock();
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => tokenValue } } } }
      ]
    }).compileComponents();
    const f = TestBed.createComponent(ResetPasswordComponent);
    f.detectChanges();
    return { fixture: f, component: f.componentInstance, router: TestBed.inject(Router), auth, toast };
  };

  beforeEach(async () => {
    authSvc = createAuthMock();
    toastSvc = createToastMock();

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: ToastService, useValue: toastSvc },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => 'valid-reset-token' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should validate token on init', () => {
    expect(authSvc.validateResetToken).toHaveBeenCalledWith('valid-reset-token');
  });

  it('should set tokenValid=true on valid token', () => {
    expect(component.tokenValid).toBe(true);
  });

  it('should set tokenValid=false on invalid token', async () => {
    const { component: c } = await setupWith('bad-token', {
      validateResetToken: jest.fn().mockReturnValue(throwError(() => new Error()))
    });
    expect(c.tokenValid).toBe(false);
  });

  it('should have invalid form with short password', () => {
    component.form.patchValue({ newPassword: 'short' });
    expect(component.form.invalid).toBe(true);
  });

  it('should have valid form with 8+ char password', () => {
    component.form.patchValue({ newPassword: 'ValidPass1' });
    expect(component.form.valid).toBe(true);
  });

  it('should call resetPassword on submit', () => {
    component.tokenValid = true;
    component.form.patchValue({ newPassword: 'NewPass123' });
    component.onSubmit();
    expect(authSvc.resetPassword).toHaveBeenCalledWith('valid-reset-token', 'NewPass123');
  });

  it('should navigate to /login after success', () => {
    const spy = jest.spyOn(router, 'navigate');
    component.form.patchValue({ newPassword: 'NewPass123' });
    component.onSubmit();
    expect(spy).toHaveBeenCalledWith(['/login']);
  });

  it('should show error toast if reset fails', () => {
    authSvc.resetPassword.mockReturnValue(throwError(() => new Error()));
    component.form.patchValue({ newPassword: 'NewPass123' });
    component.onSubmit();
    expect(toastSvc.error).toHaveBeenCalled();
  });

  it('should set tokenValid=false when no token in query', async () => {
    const { component: c } = await setupWith(null);
    expect(c.tokenValid).toBe(false);
  });
});
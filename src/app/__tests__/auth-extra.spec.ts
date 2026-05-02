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

const createAuthMock = () => ({
  forgotPassword: jest.fn().mockReturnValue(of({})),
  validateResetToken: jest.fn().mockReturnValue(of({ valid: true, message: 'ok' })),
  resetPassword: jest.fn().mockReturnValue(of({})),
  clearStorage: jest.fn()
});

const createToastMock = () => ({
  success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), toast$: of()
});

// ── Oauth2CallbackComponent ───────────────────────────────────────────────────
describe('Oauth2CallbackComponent', () => {
  let component: Oauth2CallbackComponent;
  let fixture: ComponentFixture<Oauth2CallbackComponent>;
  let router: Router;

  const makeJwt = (payload: object) =>
    `header.${btoa(JSON.stringify(payload))}.sig`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Oauth2CallbackComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (k: string) => k === 'token' ? makeJwt({ sub: 'user@test.com', role: 'USER' }) : null } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Oauth2CallbackComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => expect(component).toBeTruthy());

  it('should store token in localStorage when token is present', () => {
    fixture.detectChanges();
    expect(localStorage.getItem('access_token')).toBeTruthy();
  });

  it('should navigate to /dashboard on success', () => {
    const spy = jest.spyOn(router, 'navigate');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /login with error when no token', async () => {
    await TestBed.configureTestingModule({
      imports: [Oauth2CallbackComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    const f2 = TestBed.createComponent(Oauth2CallbackComponent);
    const r2 = TestBed.inject(Router);
    const spy = jest.spyOn(r2, 'navigate');
    f2.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/login'], { queryParams: { error: 'oauth_failed' } });
  });
});

// ── ForgotPasswordComponent ───────────────────────────────────────────────────
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

// ── ResetPasswordComponent ────────────────────────────────────────────────────
describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authSvc: ReturnType<typeof createAuthMock>;
  let toastSvc: ReturnType<typeof createToastMock>;
  let router: Router;

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
    authSvc.validateResetToken.mockReturnValue(throwError(() => new Error()));

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: ToastService, useValue: toastSvc },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => 'bad-token' } } } }
      ]
    }).compileComponents();

    const f2 = TestBed.createComponent(ResetPasswordComponent);
    f2.detectChanges();
    expect(f2.componentInstance.tokenValid).toBe(false);
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
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: ToastService, useValue: toastSvc },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } }
      ]
    }).compileComponents();
    const f3 = TestBed.createComponent(ResetPasswordComponent);
    f3.detectChanges();
    expect(f3.componentInstance.tokenValid).toBe(false);
  });
});

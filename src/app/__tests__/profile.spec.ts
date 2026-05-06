import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from '../features/profile/profile.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../shared/components/toast/toast.service';

// ── Mock GSAP so tests never touch the DOM renderer ───────────────────────────
jest.mock('gsap', () => {
  const chain: any = {};
  chain.fromTo = jest.fn().mockReturnValue(chain);
  chain.to = jest.fn().mockReturnValue(chain);
  chain.timeline = jest.fn(() => chain);
  const instance = { fromTo: jest.fn().mockReturnValue(chain), to: jest.fn().mockReturnValue(chain), timeline: jest.fn(() => chain) };
  return { ...instance, gsap: instance, default: instance };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockUser = {
  userId: 1, username: 'alice', email: 'alice@test.com', fullName: 'Alice Test',
  role: 'USER', avatarUrl: 'https://avatar.url', bio: 'Dev',
  provider: 'LOCAL', isActive: true, createdAt: '2024-01-15T10:00:00Z'
};

const oauthUser = { ...mockUser, provider: 'GITHUB', username: 'bob' };

const createAuthMock = (user = mockUser) => ({
  getCurrentUser: jest.fn().mockReturnValue(user),
  getProfile: jest.fn().mockReturnValue(of(user)),
  updateProfile: jest.fn().mockReturnValue(of({ ...user, fullName: 'Alice Updated' })),
  changePassword: jest.fn().mockReturnValue(of({})),
  deactivateAccount: jest.fn().mockReturnValue(of({})),
  clearStorage: jest.fn()
});

const createToastMock = () => ({
  success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), toast$: of()
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function createComponent(authOverride: any = {}, user = mockUser) {
  const authMock = { ...createAuthMock(user), ...authOverride };
  const toastMock = createToastMock();

  await TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProfileComponent, RouterTestingModule, ReactiveFormsModule],
    providers: [
      { provide: AuthService, useValue: authMock },
      { provide: ToastService, useValue: toastMock }
    ]
  }).compileComponents();

  const fixture: ComponentFixture<ProfileComponent> = TestBed.createComponent(ProfileComponent);
  const component: ProfileComponent = fixture.componentInstance;
  const router: Router = TestBed.inject(Router);
  fixture.detectChanges();

  return { fixture, component, router, authMock, toastMock };
}

// ═════════════════════════════════════════════════════════════════════════════
// ProfileComponent — core init
// ═════════════════════════════════════════════════════════════════════════════
describe('ProfileComponent – init', () => {
  let component: ProfileComponent;
  let authMock: ReturnType<typeof createAuthMock>;
  let toastMock: ReturnType<typeof createToastMock>;

  beforeEach(async () => {
    ({ component, authMock, toastMock } = await createComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load current user from authService', () => {
    expect(authMock.getCurrentUser).toHaveBeenCalled();
    expect(component.user?.username).toBe('alice');
  });

  it('should call getProfile on init to refresh from server', () => {
    expect(authMock.getProfile).toHaveBeenCalled();
  });

  it('should patch profileForm with server-returned user data', () => {
    expect(component.profileForm.get('username')?.value).toBe('alice');
    expect(component.profileForm.get('fullName')?.value).toBe('Alice Test');
  });

  it('should initialize profileForm with username, fullName, bio, avatarUrl', () => {
    const controls = ['username', 'fullName', 'bio', 'avatarUrl'];
    controls.forEach(c => expect(component.profileForm.contains(c)).toBe(true));
  });

  it('should initialize passwordForm with currentPassword, newPassword, confirmPassword', () => {
    const controls = ['currentPassword', 'newPassword', 'confirmPassword'];
    controls.forEach(c => expect(component.passwordForm.contains(c)).toBe(true));
  });

  it('should set avatarColor based on username', () => {
    expect(component.avatarColor).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should navigate to /login if no user returned', async () => {
    const authMock = { ...createAuthMock(), getCurrentUser: jest.fn().mockReturnValue(null) };
    const toastMock = createToastMock();

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfileComponent);
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate');  // spy BEFORE detectChanges
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/login']);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Computed getters
// ═════════════════════════════════════════════════════════════════════════════
describe('ProfileComponent – computed getters', () => {
  it('isLocalAuth should be true for LOCAL provider', async () => {
    const { component } = await createComponent({}, mockUser);
    expect(component.isLocalAuth).toBe(true);
  });

  it('isLocalAuth should be false for GITHUB provider', async () => {
    const { component } = await createComponent({}, oauthUser);
    expect(component.isLocalAuth).toBe(false);
  });

  it('providerIcon should return 🔑 for LOCAL', async () => {
    const { component } = await createComponent({}, mockUser);
    expect(component.providerIcon).toBe('🔑');
  });

  it('providerIcon should return 🐙 for GITHUB', async () => {
    const { component } = await createComponent({}, oauthUser);
    expect(component.providerIcon).toBe('🐙');
  });

  it('providerIcon should return 🌐 for GOOGLE', async () => {
    const { component } = await createComponent({}, { ...mockUser, provider: 'GOOGLE' });
    expect(component.providerIcon).toBe('🌐');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Password strength
// ═════════════════════════════════════════════════════════════════════════════
describe('ProfileComponent – passwordStrength', () => {
  let component: ProfileComponent;

  beforeEach(async () => {
    ({ component } = await createComponent());
  });

  it('should return 0 for empty password', () => {
    component.passwordForm.get('newPassword')?.setValue('');
    expect(component.passwordStrength).toBe(0);
  });

  it('should return 25 for 8-char lowercase password', () => {
    component.passwordForm.get('newPassword')?.setValue('abcdefgh');
    expect(component.passwordStrength).toBe(25);
  });

  it('should return 50 for password with length + uppercase', () => {
    component.passwordForm.get('newPassword')?.setValue('Abcdefgh');
    expect(component.passwordStrength).toBe(50);
  });

  it('should return 75 for length + uppercase + digit', () => {
    component.passwordForm.get('newPassword')?.setValue('Abcdefg1');
    expect(component.passwordStrength).toBe(75);
  });

  it('should return 100 for strong password with all criteria', () => {
    component.passwordForm.get('newPassword')?.setValue('Abcdef1!');
    expect(component.passwordStrength).toBe(100);
  });

  it('strengthLabel should be Weak at 25', () => {
    component.passwordForm.get('newPassword')?.setValue('abcdefgh');
    expect(component.strengthLabel).toBe('Weak');
  });

  it('strengthLabel should be Strong at 100', () => {
    component.passwordForm.get('newPassword')?.setValue('Abcdef1!');
    expect(component.strengthLabel).toBe('Strong');
  });

  it('strengthColor should be var(--R) for weak', () => {
    component.passwordForm.get('newPassword')?.setValue('abcdefgh');
    expect(component.strengthColor).toBe('var(--R)');
  });

  it('strengthColor should be var(--G) for strong', () => {
    component.passwordForm.get('newPassword')?.setValue('Abcdef1!');
    expect(component.strengthColor).toBe('var(--G)');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// saveProfile
// ═════════════════════════════════════════════════════════════════════════════
describe('ProfileComponent – saveProfile()', () => {
  let component: ProfileComponent;
  let authMock: ReturnType<typeof createAuthMock>;
  let toastMock: ReturnType<typeof createToastMock>;

  beforeEach(async () => {
    ({ component, authMock, toastMock } = await createComponent());
  });

  it('should not call updateProfile if form is invalid', () => {
    component.profileForm.get('username')?.setValue('');
    component.saveProfile();
    expect(authMock.updateProfile).not.toHaveBeenCalled();
  });

  it('should call updateProfile with form values on valid submit', () => {
    component.profileForm.patchValue({ username: 'alice', fullName: 'Alice', bio: 'Dev', avatarUrl: '' });
    component.saveProfile();
    expect(authMock.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'alice', fullName: 'Alice' })
    );
  });

  it('should show success toast after save', () => {
    component.profileForm.patchValue({ username: 'alice', fullName: 'Alice', bio: '', avatarUrl: '' });
    component.saveProfile();
    expect(toastMock.success).toHaveBeenCalledWith('Profile updated!');
  });

  it('should set savingProfile=false after success', () => {
    component.profileForm.patchValue({ username: 'alice', fullName: '', bio: '', avatarUrl: '' });
    component.saveProfile();
    expect(component.savingProfile).toBe(false);
  });

  it('should show error toast on failure', () => {
    authMock.updateProfile.mockReturnValue(throwError(() => new Error()));
    component.profileForm.patchValue({ username: 'alice', fullName: '', bio: '', avatarUrl: '' });
    component.saveProfile();
    expect(toastMock.error).toHaveBeenCalledWith('Failed to update profile');
  });

  it('should set savingProfile=false after error', () => {
    authMock.updateProfile.mockReturnValue(throwError(() => new Error()));
    component.profileForm.patchValue({ username: 'alice', fullName: '', bio: '', avatarUrl: '' });
    component.saveProfile();
    expect(component.savingProfile).toBe(false);
  });

  it('should update localStorage with returned user', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem');
    component.profileForm.patchValue({ username: 'alice', fullName: '', bio: '', avatarUrl: '' });
    component.saveProfile();
    expect(spy).toHaveBeenCalledWith('user', expect.any(String));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// changePassword
// ═════════════════════════════════════════════════════════════════════════════
describe('ProfileComponent – changePassword()', () => {
  let component: ProfileComponent;
  let authMock: ReturnType<typeof createAuthMock>;
  let toastMock: ReturnType<typeof createToastMock>;

  beforeEach(async () => {
    ({ component, authMock, toastMock } = await createComponent());
  });

  it('should not call changePassword if form is invalid', () => {
    component.changePassword();
    expect(authMock.changePassword).not.toHaveBeenCalled();
  });

  it('should call changePassword with currentPassword and newPassword', () => {
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!'
    });
    component.changePassword();
    expect(authMock.changePassword).toHaveBeenCalledWith('OldPass1', 'NewPass1!');
  });

  it('should show success toast on success', () => {
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!'
    });
    component.changePassword();
    expect(toastMock.success).toHaveBeenCalledWith('Password updated!');
  });

  it('should reset passwordForm after success', () => {
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!'
    });
    component.changePassword();
    expect(component.passwordForm.get('currentPassword')?.value).toBeFalsy();
  });

  it('should set savingPassword=false after success', () => {
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!'
    });
    component.changePassword();
    expect(component.savingPassword).toBe(false);
  });

  it('should show error toast on failure', () => {
    authMock.changePassword.mockReturnValue(throwError(() => new Error()));
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!'
    });
    component.changePassword();
    expect(toastMock.error).toHaveBeenCalledWith('Failed to update password');
  });

  it('should mark form invalid when passwords do not match', () => {
    component.passwordForm.patchValue({
      currentPassword: 'OldPass1', newPassword: 'NewPass1!', confirmPassword: 'Different1!'
    });
    expect(component.passwordForm.hasError('mismatch')).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Danger zone — confirmDelete / deleteAccount
// ═════════════════════════════════════════════════════════════════════════════
describe('ProfileComponent – deleteAccount()', () => {
  let component: ProfileComponent;
  let authMock: ReturnType<typeof createAuthMock>;
  let toastMock: ReturnType<typeof createToastMock>;
  let router: Router;

  beforeEach(async () => {
    ({ component, authMock, toastMock, router } = await createComponent());
  });

  it('confirmDelete should set showDeleteConfirm=true', () => {
    component.confirmDelete();
    expect(component.showDeleteConfirm).toBe(true);
  });

  it('should not call deactivateAccount if confirmText is not DELETE', () => {
    component.deleteConfirmText = 'delete'; // lowercase — should not match
    component.deleteAccount();
    expect(authMock.deactivateAccount).not.toHaveBeenCalled();
  });

  it('should call deactivateAccount when confirmText is DELETE', () => {
    component.deleteConfirmText = 'DELETE';
    component.deleteAccount();
    expect(authMock.deactivateAccount).toHaveBeenCalled();
  });

  it('should clear storage and navigate to /login after deletion', () => {
    const navSpy = jest.spyOn(router, 'navigate');
    component.deleteConfirmText = 'DELETE';
    component.deleteAccount();
    expect(authMock.clearStorage).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show error toast if deactivate fails', () => {
    authMock.deactivateAccount.mockReturnValue(throwError(() => new Error()));
    component.deleteConfirmText = 'DELETE';
    component.deleteAccount();
    expect(toastMock.error).toHaveBeenCalledWith('Failed to delete account');
  });

  it('should set deletingAccount=false after error', () => {
    authMock.deactivateAccount.mockReturnValue(throwError(() => new Error()));
    component.deleteConfirmText = 'DELETE';
    component.deleteAccount();
    expect(component.deletingAccount).toBe(false);
  });
});

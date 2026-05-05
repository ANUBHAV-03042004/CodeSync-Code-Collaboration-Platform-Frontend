import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page" #page>
      <!-- Header -->
      <div class="page-header" #pageHeader>
        <h1 class="bb">My Profile</h1>
        <div class="header-sub">Manage your account settings</div>
      </div>

      <div class="profile-grid">

        <!-- Left: Avatar + Info card -->
        <div class="profile-sidebar" #sidebar>
          <div class="avatar-card">
            <div class="avatar-wrap">
              <div class="avatar-circle" [style.background]="avatarColor">
                {{ user?.username ? user!.username[0].toUpperCase() : '?' }}
              </div>
              <div class="avatar-badge" [class]="'provider-' + user?.provider?.toLowerCase()">
                {{ providerIcon }}
              </div>
            </div>
            <div class="avatar-name bb">{{ user?.username }}</div>
            <div class="avatar-email">{{ user?.email }}</div>
            <div class="role-chip">{{ user?.role }}</div>
            <div class="joined-on">Member since {{ user?.createdAt | date:'MMM yyyy' }}</div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-lbl">Provider</span>
              <span class="info-val">{{ user?.provider }}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Account</span>
              <span class="info-val" [style.color]="user?.isActive ? 'var(--G)' : 'var(--R)'">
                {{ user?.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Full Name</span>
              <span class="info-val">{{ user?.fullName || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Forms -->
        <div class="profile-main" #mainArea>

          <!-- Edit Profile -->
          <div class="card" #card1>
            <div class="card-header">
              <div class="card-title bb">Edit Profile</div>
              <div class="card-header-bar"></div>
            </div>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="form-grid">
                <div class="form-group">
                  <label>Username</label>
                  <input formControlName="username" placeholder="username" />
                  <div class="form-err" *ngIf="profileForm.get('username')?.invalid && profileForm.get('username')?.touched">Required</div>
                </div>
                <div class="form-group">
                  <label>Full Name</label>
                  <input formControlName="fullName" placeholder="Your full name" />
                </div>
              </div>
              <div class="form-group">
                <label>Bio</label>
                <textarea formControlName="bio" rows="3" placeholder="Tell us about yourself…"></textarea>
              </div>
              <div class="form-group">
                <label>Avatar URL</label>
                <input formControlName="avatarUrl" placeholder="https://…" />
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-B" [disabled]="profileForm.invalid || savingProfile">
                  {{ savingProfile ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Change Password (local users only) -->
          <div class="card" #card2 *ngIf="isLocalAuth">
            <div class="card-header">
              <div class="card-title bb">Change Password</div>
              <div class="card-header-bar" style="background:var(--B)"></div>
            </div>
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" formControlName="currentPassword" placeholder="••••••••" />
                <div class="form-err" *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched">Required</div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>New Password</label>
                  <input type="password" formControlName="newPassword" placeholder="Min 8 characters" />
                  <div class="form-err" *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched">Min 8 characters</div>
                </div>
                <div class="form-group">
                  <label>Confirm Password</label>
                  <input type="password" formControlName="confirmPassword" placeholder="Re-enter new password" />
                  <div class="form-err" *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched">Passwords don't match</div>
                </div>
              </div>
              <div class="password-strength" *ngIf="passwordForm.get('newPassword')?.value">
                <div class="ps-label">Strength</div>
                <div class="ps-bar">
                  <div class="ps-fill" [style.width]="passwordStrength + '%'" [style.background]="strengthColor"></div>
                </div>
                <div class="ps-text" [style.color]="strengthColor">{{ strengthLabel }}</div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-B" [disabled]="passwordForm.invalid || savingPassword">
                  {{ savingPassword ? 'Updating…' : 'Update Password' }}
                </button>
              </div>
            </form>
          </div>

          <!-- OAuth users notice -->
          <div class="card oauth-notice" *ngIf="!isLocalAuth">
            <div class="card-header">
              <div class="card-title bb">Password</div>
              <div class="card-header-bar" style="background:var(--Y)"></div>
            </div>
            <div class="oauth-msg">
              <span class="oauth-icon">{{ providerIcon }}</span>
              <div>
                <p>Your account uses <strong>{{ user?.provider }}</strong> for authentication.</p>
                <p style="opacity:.6;font-size:13px;margin-top:4px">To change your password, please visit your {{ user?.provider }} account settings.</p>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="card danger-zone" #card3>
            <div class="card-header">
              <div class="card-title bb" style="color:var(--R)">Danger Zone</div>
              <div class="card-header-bar" style="background:var(--R)"></div>
            </div>
            <div class="danger-row">
              <div>
                <div class="danger-title">Delete Account</div>
                <div class="danger-desc">Permanently delete your account and all associated data. This action cannot be undone.</div>
              </div>
              <button class="btn btn-R" (click)="confirmDelete()" *ngIf="!showDeleteConfirm">
                🗑 Delete Account
              </button>
            </div>
            <!-- Confirmation -->
            <div class="delete-confirm" *ngIf="showDeleteConfirm">
              <div class="confirm-warning">
                ⚠️ This will permanently delete your account, all projects, and data. Are you absolutely sure?
              </div>
              <div class="confirm-input-row">
                <input [(ngModel)]="deleteConfirmText" placeholder='Type "DELETE" to confirm' class="confirm-input" />
              </div>
              <div class="confirm-actions">
                <button class="btn btn-outline" (click)="showDeleteConfirm=false;deleteConfirmText=''">Cancel</button>
                <button class="btn btn-R" (click)="deleteAccount()"
                  [disabled]="deleteConfirmText !== 'DELETE' || deletingAccount">
                  {{ deletingAccount ? 'Deleting…' : 'Yes, Delete My Account' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding:36px;max-width:1100px;margin:0 auto; }

    /* Header */
    .page-header { margin-bottom:32px; }
    h1 { font-size:44px;letter-spacing:.04em;line-height:1;margin:0 0 6px; }
    .header-sub { font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5; }

    /* Grid */
    .profile-grid { display:grid;grid-template-columns:280px 1fr;gap:24px;align-items:start; }

    /* Sidebar */
    .profile-sidebar { display:flex;flex-direction:column;gap:16px; }
    .avatar-card { border:3px solid var(--K);background:var(--W);padding:28px 20px;text-align:center;box-shadow:5px 5px 0 var(--K);display:flex;flex-direction:column;align-items:center;gap:10px; }
    .avatar-wrap { position:relative;margin-bottom:8px; }
    .avatar-circle { width:88px;height:88px;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;color:var(--W);border:3px solid var(--K); }
    .avatar-badge { position:absolute;bottom:-4px;right:-4px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:2px solid var(--K);font-size:14px;background:var(--W); }
    .avatar-name { font-size:22px;letter-spacing:.04em; }
    .avatar-email { font-size:12px;opacity:.5;font-weight:600; }
    .role-chip { display:inline-block;background:var(--B);color:var(--W);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:3px 12px;border:2px solid var(--K); }
    .joined-on { font-size:11px;opacity:.4;font-weight:600;text-transform:uppercase;letter-spacing:.07em; }

    .info-card { border:3px solid var(--K);background:var(--W);box-shadow:4px 4px 0 var(--K); }
    .info-row { display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:2px solid rgba(0,0,0,.06); }
    .info-row:last-child { border-bottom:none; }
    .info-lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5; }
    .info-val { font-size:13px;font-weight:700; }

    /* Main area */
    .profile-main { display:flex;flex-direction:column;gap:20px; }

    /* Cards */
    .card { border:3px solid var(--K);background:var(--W);box-shadow:5px 5px 0 var(--K); }
    .card-header { display:flex;align-items:center;gap:14px;padding:18px 24px;border-bottom:3px solid var(--K); }
    .card-title { font-size:22px;letter-spacing:.04em; }
    .card-header-bar { flex:1;height:3px;background:var(--K); }
    .card form { padding:24px; }

    /* Forms */
    .form-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
    .form-group { display:flex;flex-direction:column;gap:6px;margin-bottom:16px; }
    label { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.6; }
    input, textarea {
      border:3px solid var(--K);padding:10px 14px;font-family:'Space Grotesk',sans-serif;
      font-size:14px;font-weight:600;background:var(--W);color:var(--K);
      outline:none;transition:box-shadow .15s;resize:vertical;
    }
    input:focus, textarea:focus { box-shadow:4px 4px 0 var(--B);border-color:var(--B); }
    .form-err { font-size:11px;color:var(--R);font-weight:700;text-transform:uppercase;letter-spacing:.05em; }
    .form-actions { display:flex;justify-content:flex-end;padding-top:8px; }

    /* Buttons */
    .btn { display:inline-flex;align-items:center;gap:8px;padding:11px 22px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;border:3px solid var(--K);cursor:pointer;box-shadow:4px 4px 0 var(--K);background:var(--W);color:var(--K);transition:transform .08s,box-shadow .08s; }
    .btn:hover:not(:disabled) { transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--K); }
    .btn:disabled { opacity:.5;cursor:not-allowed; }
    .btn-B { background:var(--B);color:var(--W);border-color:var(--B);box-shadow:4px 4px 0 var(--K); }
    .btn-R { background:var(--R);color:var(--W);border-color:var(--R);box-shadow:4px 4px 0 var(--K); }
    .btn-outline { background:transparent; }

    /* Password strength */
    .password-strength { display:flex;align-items:center;gap:10px;margin-bottom:16px; }
    .ps-label { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;flex-shrink:0; }
    .ps-bar { flex:1;height:6px;background:rgba(0,0,0,.08);border:2px solid var(--K); }
    .ps-fill { height:100%;transition:width .4s,background .4s; }
    .ps-text { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;flex-shrink:0; }

    /* OAuth notice */
    .oauth-notice .card-header { padding:18px 24px; }
    .oauth-msg { display:flex;align-items:flex-start;gap:14px;padding:20px 24px; }
    .oauth-icon { font-size:28px;flex-shrink:0; }
    .oauth-msg p { margin:0;font-size:14px;font-weight:600; }

    /* Danger zone */
    .danger-zone { border-color:var(--R);box-shadow:5px 5px 0 var(--R); }
    .danger-zone .card-header { border-bottom-color:var(--R); }
    .danger-row { display:flex;align-items:center;justify-content:space-between;padding:20px 24px;gap:20px;flex-wrap:wrap; }
    .danger-title { font-size:15px;font-weight:800;margin-bottom:4px; }
    .danger-desc { font-size:13px;opacity:.6;max-width:400px;line-height:1.5; }
    .delete-confirm { padding:20px 24px;border-top:2px solid rgba(220,38,38,.3); }
    .confirm-warning { background:rgba(220,38,38,.08);border:2px solid var(--R);padding:12px 16px;font-size:13px;font-weight:700;margin-bottom:16px;line-height:1.5; }
    .confirm-input-row { margin-bottom:16px; }
    .confirm-input { width:100%;border:3px solid var(--R);padding:10px 14px;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:600;background:var(--W);color:var(--K);outline:none;box-sizing:border-box; }
    .confirm-actions { display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap; }

    @media(max-width:768px) {
      .profile-grid { grid-template-columns:1fr; }
      .profile-page { padding:20px 16px; }
      h1 { font-size:32px; }
      .form-grid { grid-template-columns:1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit, AfterViewInit {
  @ViewChild('page') pageRef!: ElementRef;
  @ViewChild('pageHeader') headerRef!: ElementRef;
  @ViewChild('sidebar') sidebarRef!: ElementRef;
  @ViewChild('mainArea') mainRef!: ElementRef;

  private authSvc = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  user: User | null = null;
  avatarColor = '#1A6FFF';
  savingProfile = false;
  savingPassword = false;
  deletingAccount = false;
  showDeleteConfirm = false;
  deleteConfirmText = '';

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  get isLocalAuth(): boolean { return this.user?.provider === 'LOCAL'; }
  get providerIcon(): string {
    const icons: Record<string,string> = { LOCAL: '🔑', GITHUB: '🐙', GOOGLE: '🌐' };
    return icons[this.user?.provider || 'LOCAL'] || '🔑';
  }

  get passwordStrength(): number {
    const pw = this.passwordForm?.get('newPassword')?.value || '';
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (/[A-Z]/.test(pw)) score += 25;
    if (/[0-9]/.test(pw)) score += 25;
    if (/[^A-Za-z0-9]/.test(pw)) score += 25;
    return score;
  }

  get strengthColor(): string {
    const s = this.passwordStrength;
    if (s <= 25) return 'var(--R)';
    if (s <= 50) return '#f97316';
    if (s <= 75) return 'var(--Y)';
    return 'var(--G)';
  }

  get strengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 25) return 'Weak';
    if (s <= 50) return 'Fair';
    if (s <= 75) return 'Good';
    return 'Strong';
  }

  ngOnInit(): void {
    this.user = this.authSvc.getCurrentUser();
    if (!this.user) { this.router.navigate(['/login']); return; }

    const colors = ['#FF2D2D','#1A6FFF','#00C853','#FFD600'];
    this.avatarColor = this.user.username ? colors[this.user.username.charCodeAt(0) % colors.length] : colors[0];

    // Load fresh profile from server
    this.authSvc.getProfile().subscribe({
      next: (u) => {
        this.user = u;
        localStorage.setItem('user', JSON.stringify(u));
        this.profileForm.patchValue({ username: u.username, fullName: u.fullName, bio: u.bio, avatarUrl: u.avatarUrl });
      },
      error: () => {} // fallback to stored user
    });

    this.profileForm = this.fb.group({
      username: [this.user.username, Validators.required],
      fullName: [this.user.fullName || ''],
      bio: [this.user.bio || ''],
      avatarUrl: [this.user.avatarUrl || '']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const pw = form.get('newPassword')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return pw === confirm ? null : { mismatch: true };
  }

  ngAfterViewInit(): void {
    if (!this.pageRef?.nativeElement) return;
    const tl = gsap.timeline();
    tl.fromTo(this.pageRef.nativeElement,
        { opacity:0 }, { opacity:1, duration:.3 })
      .fromTo(this.headerRef?.nativeElement || {},
        { y:-20, opacity:0 }, { y:0, opacity:1, duration:.4, ease:'power2.out' }, '-=.1')
      .fromTo(this.sidebarRef?.nativeElement || {},
        { x:-24, opacity:0 }, { x:0, opacity:1, duration:.45, ease:'power3.out' }, '-=.2')
      .fromTo(this.mainRef?.nativeElement?.querySelectorAll('.card') || [],
        { y:24, opacity:0 }, { y:0, opacity:1, duration:.4, stagger:.1, ease:'power2.out' }, '-=.3');
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    const data = this.profileForm.value;
    this.authSvc.updateProfile(data).subscribe({
      next: (u) => {
        this.user = u;
        localStorage.setItem('user', JSON.stringify(u));
        this.toast.success('Profile updated!');
        this.savingProfile = false;
      },
      error: () => { this.toast.error('Failed to update profile'); this.savingProfile = false; }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authSvc.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.toast.success('Password updated!');
        this.passwordForm.reset();
        this.savingPassword = false;
      },
      error: () => { this.toast.error('Failed to update password'); this.savingPassword = false; }
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
    setTimeout(() => {
      const el = document.querySelector('.delete-confirm');
      if (el) gsap.fromTo(el, { opacity:0, y:10 }, { opacity:1, y:0, duration:.3, ease:'power2.out' });
    }, 50);
  }

  deleteAccount(): void {
    if (this.deleteConfirmText !== 'DELETE') return;
    this.deletingAccount = true;
    this.authSvc.deactivateAccount().subscribe({
      next: () => {
        this.authSvc.clearStorage();
        this.router.navigate(['/login']);
      },
      error: () => { this.toast.error('Failed to delete account'); this.deletingAccount = false; }
    });
  }
}

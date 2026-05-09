import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="profile-page" #page>

      <!-- Top Banner -->
      <div class="banner" #banner>
        <div class="banner-left">
          <div class="banner-label">MY ACCOUNT</div>
          <h1 class="banner-title bb">{{ user?.username || 'Profile' }}</h1>
          <div class="banner-email">{{ user?.email }}</div>
        </div>
        <div class="avatar-hero" [style.background]="avatarColor">
          {{ user?.username ? user!.username[0].toUpperCase() : '?' }}
          <div class="avatar-provider">{{ providerIcon }}</div>
        </div>
      </div>

      <div class="profile-grid">

        <!-- Sidebar -->
        <aside class="sidebar" #sidebar>
          <div class="info-card">
            <div class="ic-header">ACCOUNT INFO</div>
            <div class="ic-row">
              <span class="ic-key">ROLE</span>
              <span class="ic-val role-chip">{{ user?.role }}</span>
            </div>
            <div class="ic-row">
              <span class="ic-key">STATUS</span>
              <span class="ic-val" [class.active-status]="user?.isActive" [class.inactive-status]="!user?.isActive">
                {{ user?.isActive ? '● ACTIVE' : '○ INACTIVE' }}
              </span>
            </div>
            <div class="ic-row">
              <span class="ic-key">PROVIDER</span>
              <span class="ic-val">{{ providerIcon }} {{ user?.provider }}</span>
            </div>
            <div class="ic-row">
              <span class="ic-key">FULL NAME</span>
              <span class="ic-val">{{ user?.fullName || '—' }}</span>
            </div>
            <div class="ic-row">
              <span class="ic-key">MEMBER SINCE</span>
              <span class="ic-val">{{ user?.createdAt | date:'MMM yyyy' }}</span>
            </div>
          </div>

          <div class="bio-card" *ngIf="user?.bio">
            <div class="ic-header">BIO</div>
            <p class="bio-text">{{ user?.bio }}</p>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="profile-main" #mainArea>

          <!-- Edit Profile Card -->
          <div class="nb-card" #card1>
            <div class="nb-card-hdr yellow-hdr">
              <span class="card-label">✏️ EDIT PROFILE</span>
              <div class="hdr-accent"></div>
            </div>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="nb-form">
              <div class="form-row">
                <div class="nb-field">
                  <label>USERNAME *</label>
                  <div class="input-wrap">
                    <span class="input-pfx">@</span>
                    <input formControlName="username" placeholder="your_username" />
                  </div>
                  <div class="form-err" *ngIf="profileForm.get('username')?.invalid && profileForm.get('username')?.touched">Required</div>
                </div>
                <div class="nb-field">
                  <label>FULL NAME</label>
                  <div class="input-wrap">
                    <span class="input-pfx">✦</span>
                    <input formControlName="fullName" placeholder="Jane Doe" />
                  </div>
                </div>
              </div>
              <div class="nb-field">
                <label>BIO</label>
                <textarea formControlName="bio" rows="3" placeholder="Tell us about yourself…"></textarea>
              </div>
              <div class="nb-field">
                <label>AVATAR URL</label>
                <div class="input-wrap">
                  <span class="input-pfx">🖼</span>
                  <input formControlName="avatarUrl" placeholder="https://…" />
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="nb-btn yellow-btn" [disabled]="profileForm.invalid || savingProfile">
                  {{ savingProfile ? 'Saving…' : 'Save Changes →' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Change Password (local users only) -->
          <div class="nb-card" #card2 *ngIf="isLocalAuth">
            <div class="nb-card-hdr blue-hdr">
              <span class="card-label">🔑 CHANGE PASSWORD</span>
              <div class="hdr-accent"></div>
            </div>
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="nb-form">
              <div class="nb-field">
                <label>CURRENT PASSWORD</label>
                <input type="password" formControlName="currentPassword" placeholder="••••••••" />
                <div class="form-err" *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched">Required</div>
              </div>
              <div class="form-row">
                <div class="nb-field">
                  <label>NEW PASSWORD</label>
                  <input type="password" formControlName="newPassword" placeholder="Min 8 characters" />
                  <div class="form-err" *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched">Min 8 characters</div>
                </div>
                <div class="nb-field">
                  <label>CONFIRM PASSWORD</label>
                  <input type="password" formControlName="confirmPassword" placeholder="Re-enter password" />
                  <div class="form-err" *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched">Passwords don't match</div>
                </div>
              </div>
              <div class="strength-row" *ngIf="passwordForm.get('newPassword')?.value">
                <span class="str-lbl">STRENGTH</span>
                <div class="str-track"><div class="str-fill" [style.width]="passwordStrength + '%'" [style.background]="strengthColor"></div></div>
                <span class="str-tag" [style.color]="strengthColor">{{ strengthLabel }}</span>
              </div>
              <div class="form-actions">
                <button type="submit" class="nb-btn blue-btn" [disabled]="passwordForm.invalid || savingPassword">
                  {{ savingPassword ? 'Updating…' : 'Update Password →' }}
                </button>
              </div>
            </form>
          </div>

          <!-- OAuth notice -->
          <div class="nb-card oauth-card" *ngIf="!isLocalAuth">
            <div class="nb-card-hdr green-hdr">
              <span class="card-label">🔐 PASSWORD</span>
              <div class="hdr-accent"></div>
            </div>
            <div class="oauth-body">
              <span class="oauth-big-icon">{{ providerIcon }}</span>
              <div>
                <p class="oauth-title">Managed by <strong>{{ user?.provider }}</strong></p>
                <p class="oauth-sub">Your password is managed by {{ user?.provider }}. Visit your {{ user?.provider }} account settings to make changes.</p>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="nb-card danger-card" #card3>
            <div class="nb-card-hdr red-hdr">
              <span class="card-label">⚠️ DANGER ZONE</span>
              <div class="hdr-accent"></div>
            </div>
            <div class="danger-body">
              <div class="danger-text">
                <div class="danger-title">Delete Account</div>
                <div class="danger-desc">Permanently deletes your account and all associated data. This action <strong>cannot be undone</strong>.</div>
              </div>
              <button class="nb-btn red-btn" (click)="confirmDelete()" *ngIf="!showDeleteConfirm">
                🗑 Delete Account
              </button>
            </div>
            <div class="delete-confirm" *ngIf="showDeleteConfirm">
              <div class="confirm-warning">⚠️ This is irreversible. All your projects, files and data will be permanently destroyed.</div>
              <div class="confirm-row">
                <input [(ngModel)]="deleteConfirmText" placeholder='Type "DELETE" to confirm' class="confirm-input" />
              </div>
              <div class="confirm-actions">
                <button class="nb-btn outline-btn" (click)="showDeleteConfirm=false;deleteConfirmText=''">Cancel</button>
                <button class="nb-btn red-btn" (click)="deleteAccount()"
                  [disabled]="deleteConfirmText !== 'DELETE' || deletingAccount">
                  {{ deletingAccount ? 'Deleting…' : 'Yes, Delete Everything' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Page ── */
    .profile-page { padding:36px;max-width:1140px;margin:0 auto; }

    /* ── Banner ── */
    .banner { display:flex;align-items:center;justify-content:space-between;background:#0A0A0A;border:4px solid #0A0A0A;box-shadow:8px 8px 0 #0A0A0A;padding:36px 40px;margin-bottom:32px;position:relative;overflow:hidden; }
    .banner::before { content:'';position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#E53935,#1E88E5,#43A047,#FDD835); }
    .banner-label { font-size:11px;font-weight:800;letter-spacing:2px;color:#FDD835;text-transform:uppercase;margin-bottom:8px; }
    .banner-title { font-family:'Bebas Neue',sans-serif;font-size:56px;color:#fff;letter-spacing:.05em;line-height:1;margin:0 0 6px; }
    .banner-email { font-size:13px;color:rgba(255,255,255,.4);font-weight:600; }
    .avatar-hero { width:100px;height:100px;display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:900;color:#fff;border:4px solid #FDD835;position:relative;flex-shrink:0; }
    .avatar-provider { position:absolute;bottom:-8px;right:-8px;width:28px;height:28px;background:#FDD835;border:3px solid #0A0A0A;display:flex;align-items:center;justify-content:center;font-size:13px; }

    /* ── Grid ── */
    .profile-grid { display:grid;grid-template-columns:300px 1fr;gap:24px;align-items:start; }

    /* ── Sidebar ── */
    .sidebar { display:flex;flex-direction:column;gap:16px; }
    .info-card,.bio-card { border:3px solid #0A0A0A;background:#fff;box-shadow:5px 5px 0 #0A0A0A; }
    .ic-header { background:#0A0A0A;color:#FDD835;font-size:10px;font-weight:800;letter-spacing:2px;padding:8px 16px; }
    .ic-row { display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:2px solid rgba(0,0,0,.06); }
    .ic-row:last-child { border-bottom:none; }
    .ic-key { font-size:10px;font-weight:800;letter-spacing:1.5px;color:#888;text-transform:uppercase; }
    .ic-val { font-size:12px;font-weight:700;text-transform:uppercase; }
    .role-chip { background:#1E88E5;color:#fff;padding:2px 10px;font-size:10px;border:2px solid #0A0A0A; }
    .active-status { color:#43A047; }
    .inactive-status { color:#E53935; }
    .bio-card { padding:16px; }
    .bio-text { font-size:13px;color:#444;line-height:1.6;margin:0; }

    /* ── Main ── */
    .profile-main { display:flex;flex-direction:column;gap:20px; }

    /* ── Cards ── */
    .nb-card { border:3px solid #0A0A0A;background:#fff;box-shadow:6px 6px 0 #0A0A0A; }
    .nb-card-hdr { display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:3px solid #0A0A0A; }
    .yellow-hdr { background:#FDD835; }
    .blue-hdr   { background:#1E88E5; }
    .green-hdr  { background:#43A047; }
    .red-hdr    { background:#E53935; }
    .card-label { font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#0A0A0A; }
    .blue-hdr .card-label,.green-hdr .card-label,.red-hdr .card-label { color:#fff; }
    .hdr-accent { flex:1;height:3px;background:rgba(0,0,0,.2); }

    /* ── Forms ── */
    .nb-form { padding:24px;display:flex;flex-direction:column;gap:16px; }
    .form-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
    .nb-field { display:flex;flex-direction:column;gap:6px; }
    label { font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#666; }
    .input-wrap { display:flex;align-items:center;border:3px solid #0A0A0A;box-shadow:3px 3px 0 #0A0A0A;transition:box-shadow .12s; }
    .input-wrap:focus-within { box-shadow:4px 4px 0 #1E88E5;border-color:#1E88E5; }
    .input-pfx { padding:0 12px;font-weight:700;color:#fff;background:#0A0A0A;min-height:44px;display:flex;align-items:center;flex-shrink:0;font-size:14px; }
    input, textarea { border:3px solid #0A0A0A;padding:11px 14px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;background:#fff;color:#0A0A0A;outline:none;width:100%;box-sizing:border-box;box-shadow:3px 3px 0 #0A0A0A;transition:box-shadow .12s,border-color .12s;resize:vertical; }
    .input-wrap input { border:none;box-shadow:none;padding:11px 12px;flex:1; }
    input:focus, textarea:focus { box-shadow:4px 4px 0 #1E88E5;border-color:#1E88E5; }
    .input-wrap input:focus { box-shadow:none;border-color:transparent; }
    .form-err { font-size:10px;color:#E53935;font-weight:800;text-transform:uppercase;letter-spacing:1px; }
    .form-actions { display:flex;justify-content:flex-end;padding-top:4px; }

    /* ── Strength Bar ── */
    .strength-row { display:flex;align-items:center;gap:10px; }
    .str-lbl { font-size:10px;font-weight:800;letter-spacing:1.5px;color:#888;flex-shrink:0; }
    .str-track { flex:1;height:8px;background:#eee;border:2px solid #0A0A0A; }
    .str-fill { height:100%;transition:width .4s,background .4s; }
    .str-tag { font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;flex-shrink:0;min-width:48px;text-align:right; }

    /* ── Buttons ── */
    .nb-btn { border:3px solid #0A0A0A;box-shadow:4px 4px 0 #0A0A0A;padding:11px 22px;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer;transition:transform .08s,box-shadow .08s;display:inline-flex;align-items:center;gap:8px; }
    .nb-btn:hover:not(:disabled) { transform:translate(-2px,-2px);box-shadow:6px 6px 0 #0A0A0A; }
    .nb-btn:disabled { opacity:.5;cursor:not-allowed;transform:none; }
    .yellow-btn  { background:#FDD835;color:#0A0A0A; }
    .blue-btn    { background:#1E88E5;color:#fff; }
    .green-btn   { background:#43A047;color:#fff; }
    .red-btn     { background:#E53935;color:#fff; }
    .outline-btn { background:#fff;color:#0A0A0A; }

    /* ── OAuth ── */
    .oauth-body { display:flex;align-items:flex-start;gap:16px;padding:20px 24px; }
    .oauth-big-icon { font-size:36px;flex-shrink:0; }
    .oauth-title { font-size:15px;font-weight:800;margin:0 0 4px; }
    .oauth-sub { font-size:13px;color:#666;margin:0;line-height:1.5; }

    /* ── Danger ── */
    .danger-card { border-color:#E53935;box-shadow:6px 6px 0 #E53935; }
    .danger-body { display:flex;align-items:center;justify-content:space-between;padding:20px 24px;gap:20px;flex-wrap:wrap; }
    .danger-title { font-size:15px;font-weight:800;margin-bottom:4px; }
    .danger-desc { font-size:13px;color:#666;max-width:400px;line-height:1.5; }
    .delete-confirm { padding:20px 24px;border-top:3px solid #E53935; }
    .confirm-warning { background:rgba(229,57,53,.08);border:3px solid #E53935;padding:14px;font-size:13px;font-weight:700;margin-bottom:16px;line-height:1.5; }
    .confirm-row { margin-bottom:16px; }
    .confirm-input { width:100%;border:3px solid #E53935;padding:11px 14px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;background:#fff;color:#0A0A0A;outline:none;box-sizing:border-box;box-shadow:3px 3px 0 #E53935; }
    .confirm-actions { display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap; }

    @media(max-width:900px) {
      .profile-grid { grid-template-columns:1fr; }
      .profile-page { padding:20px 16px; }
      .banner-title { font-size:40px; }
      .form-row { grid-template-columns:1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit, AfterViewInit {
  @ViewChild('page')     pageRef!: ElementRef;
  @ViewChild('banner')   bannerRef!: ElementRef;
  @ViewChild('sidebar')  sidebarRef!: ElementRef;
  @ViewChild('mainArea') mainRef!: ElementRef;

  private authSvc = inject(AuthService);
  private toast   = inject(ToastService);
  private router  = inject(Router);
  private fb      = inject(FormBuilder);
  private ngZone  = inject(NgZone);

  user: User | null = null;
  avatarColor = '#1E88E5';
  savingProfile  = false;
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
    let s = 0;
    if (pw.length >= 8)        s += 25;
    if (/[A-Z]/.test(pw))      s += 25;
    if (/[0-9]/.test(pw))      s += 25;
    if (/[^A-Za-z0-9]/.test(pw)) s += 25;
    return s;
  }
  get strengthColor(): string {
    const s = this.passwordStrength;
    if (s <= 25) return '#E53935';
    if (s <= 50) return '#FB8C00';
    if (s <= 75) return '#FDD835';
    return '#43A047';
  }
  get strengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 25) return 'Weak';
    if (s <= 50) return 'Fair';
    if (s <= 75) return 'Good';
    return 'Strong';
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      username:  ['', Validators.required],
      fullName:  [''],
      bio:       [''],
      avatarUrl: ['']
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.user = this.authSvc.getCurrentUser();
    if (!this.user) { this.router.navigate(['/login']); return; }

    const colors = ['#E53935','#1E88E5','#43A047','#FDD835'];
    this.avatarColor = this.user.username ? colors[this.user.username.charCodeAt(0) % colors.length] : colors[0];

    this.profileForm.patchValue({
      username: this.user.username, fullName: this.user.fullName || '',
      bio: this.user.bio || '', avatarUrl: this.user.avatarUrl || ''
    });

    this.authSvc.getProfile().subscribe({
      next: (u) => {
        this.user = u;
        localStorage.setItem('user', JSON.stringify(u));
        this.profileForm.patchValue({ username: u.username, fullName: u.fullName, bio: u.bio, avatarUrl: u.avatarUrl });
      },
      error: () => {}
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const pw = form.get('newPassword')?.value;
    const c  = form.get('confirmPassword')?.value;
    return pw === c ? null : { mismatch: true };
  }

  ngAfterViewInit(): void {
    if (!this.pageRef?.nativeElement) return;
    const tl = gsap.timeline();
    tl.fromTo(this.bannerRef.nativeElement,
        { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' })
      .fromTo(this.sidebarRef?.nativeElement,
        { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'power3.out' }, '-=.2')
      .fromTo(this.mainRef?.nativeElement?.querySelectorAll('.nb-card') || [],
        { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .1, ease: 'power2.out' }, '-=.3');
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    this.authSvc.updateProfile(this.profileForm.value).subscribe({
      next: (u) => { this.user = u; localStorage.setItem('user', JSON.stringify(u)); this.toast.success('Profile updated!'); this.savingProfile = false; },
      error: () => { this.toast.error('Failed to update profile'); this.savingProfile = false; }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authSvc.changePassword(currentPassword, newPassword).subscribe({
      next: () => { this.toast.success('Password updated!'); this.passwordForm.reset(); this.savingPassword = false; },
      error: () => { this.toast.error('Failed to update password'); this.savingPassword = false; }
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
    setTimeout(() => {
      const el = document.querySelector('.delete-confirm');
      if (el) gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' });
    }, 50);
  }

  deleteAccount(): void {
    if (this.deleteConfirmText !== 'DELETE') return;
    this.deletingAccount = true;
    this.authSvc.deactivateAccount().subscribe({
      next: () => { this.authSvc.clearStorage(); this.ngZone.run(() => this.router.navigate(['/login'])); },
      error: () => { this.toast.error('Failed to delete account'); this.deletingAccount = false; }
    });
  }
}

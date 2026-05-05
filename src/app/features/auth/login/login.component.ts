import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <!-- Left panel -->
      <div class="lg-left" #leftPanel>
        <div class="lg-deco1"></div>
        <div class="lg-deco2"></div>
        <div class="lg-deco3"></div>
        <div class="lg-hero" #hero>Code<span>Sync</span></div>
        <p class="lg-sub">Collaborative coding, reimagined. Build together, ship faster.</p>
        <div class="lg-strip">
          <div style="background:var(--R)"></div>
          <div style="background:var(--B)"></div>
          <div style="background:var(--G)"></div>
          <div style="background:var(--Y)"></div>
        </div>
      </div>
      <!-- Right panel -->
      <div class="lg-right">
        <div class="lg-form-box" #formBox>
          <h2 class="bb">Sign In</h2>
          <p class="sub">Welcome back — enter your credentials below.</p>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-stack" #formEl>
            <div class="field" #emailField>
              <label>Email</label>
              <input type="email" formControlName="email" placeholder="you@example.com" />
              <span class="err" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">Valid email required</span>
            </div>
            <div class="field" #passField>
              <label>Password</label>
              <input type="password" formControlName="password" placeholder="••••••••" />
              <span class="err" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">Password required</span>
            </div>
            <button type="submit" class="btn btn-K" [disabled]="loading" style="width:100%;padding:15px;font-size:14px">
              {{ loading ? 'Signing in…' : 'Sign In →' }}
            </button>
          </form>
          <div class="divline"><span>or</span></div>
          <div class="oauth-row" #oauthRow>
            <a [href]="githubOAuthUrl" class="btn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
            <a [href]="googleOAuthUrl" class="btn btn-R" style="font-size:12px">
              Google
            </a>
          </div>
          <div class="auth-foot">
            No account? <a routerLink="/register">Sign up free</a>
            &nbsp;·&nbsp;
            <a routerLink="/forgot-password">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display:flex;min-height:100vh; }
    .lg-left { flex:0 0 420px;background:var(--K);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 40px;position:relative;overflow:hidden; }
    .lg-deco1 { position:absolute;top:-50px;right:-50px;width:220px;height:220px;background:var(--Y);border:4px solid var(--W);opacity:.12;transform:rotate(18deg); }
    .lg-deco2 { position:absolute;bottom:-60px;left:-40px;width:260px;height:260px;background:var(--R);border:4px solid var(--W);opacity:.1;transform:rotate(-14deg); }
    .lg-deco3 { position:absolute;top:50%;left:-30px;width:100px;height:100px;background:var(--B);border:3px solid var(--W);opacity:.08;transform:translateY(-50%) rotate(8deg); }
    .lg-hero { font-family:'Bebas Neue',sans-serif;font-size:90px;line-height:.88;letter-spacing:.04em;color:var(--W);text-align:center;position:relative;z-index:1; }
    .lg-hero span { color:var(--Y);display:block; }
    .lg-sub { color:rgba(255,255,240,.5);font-size:14px;text-align:center;margin-top:20px;position:relative;z-index:1;max-width:240px;line-height:1.6;font-weight:500; }
    .lg-strip { display:flex;margin-top:36px;border:3px solid var(--W);overflow:hidden;position:relative;z-index:1;width:200px; }
    .lg-strip div { height:14px;flex:1; }
    .lg-right { flex:1;display:flex;align-items:center;justify-content:center;padding:60px 48px;background:var(--O); }
    .lg-form-box { width:100%;max-width:400px; }
    h2 { font-size:46px;letter-spacing:.05em;margin-bottom:4px; }
    .sub { color:#777;font-size:14px;margin-bottom:32px;font-weight:500; }
    .form-stack { display:flex;flex-direction:column;gap:18px; }
    .field { display:flex;flex-direction:column;gap:6px; }
    .field label { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.09em; }
    .field input { border:3px solid #0A0A0A;background:var(--O);padding:12px 14px;font-family:'Space Grotesk',sans-serif;font-size:14px;color:#0A0A0A;outline:none;box-shadow:3px 3px 0 #0A0A0A;transition:box-shadow .1s,border-color .1s; }
    .field input:focus { box-shadow:5px 5px 0 #1A6FFF;border-color:#1A6FFF; }
    .field input::placeholder { color:#999; }
    .err { color:var(--R);font-size:12px;font-weight:700; }
    .btn { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;border:3px solid #0A0A0A;cursor:pointer;text-decoration:none;box-shadow:5px 5px 0 #0A0A0A;background:var(--W);color:#0A0A0A;transition:transform .08s,box-shadow .08s;flex:1; }
    .btn:hover { transform:translate(-2px,-2px);box-shadow:8px 8px 0 #0A0A0A; }
    .btn:disabled { opacity:.55;cursor:not-allowed; }
    .btn-K { background:#0A0A0A;color:var(--W); }
    .btn-R { background:var(--R);color:var(--W); }
    .divline { display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa;margin:8px 0; }
    .divline::before,.divline::after { content:'';flex:1;height:2px;background:#0A0A0A; }
    .oauth-row { display:flex;gap:12px; }
    .auth-foot { margin-top:22px;font-size:13px;color:#777;font-weight:500; }
    .auth-foot a { color:var(--B);font-weight:700;text-decoration:underline;cursor:pointer; }
    @media(max-width:900px) {
      .auth-page { flex-direction:column; }
      .lg-left { flex:0 0 auto;min-height:220px;padding:40px 24px; }
      .lg-hero { font-size:60px; }
      .lg-right { padding:40px 24px; }
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('formBox') formBoxRef!: ElementRef;
  @ViewChild('hero') heroRef!: ElementRef;
  @ViewChild('formEl') formRef!: ElementRef;
  @ViewChild('oauthRow') oauthRef!: ElementRef;
  @ViewChild('emailField') emailRef!: ElementRef;
  @ViewChild('passField') passRef!: ElementRef;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  form!: FormGroup;
  loading = false;
  // OAuth2 → gateway route: /oauth2/authorization/* → auth-service (auth-oauth2 route)
  get githubOAuthUrl(): string { return this.auth.githubOAuthUrl; }
  get googleOAuthUrl(): string  { return this.auth.googleOAuthUrl; }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    gsap.fromTo(this.heroRef.nativeElement, { y:60, opacity:0 }, { y:0, opacity:1, duration:.7, ease:'power3.out' });
    gsap.fromTo(this.formBoxRef.nativeElement, { x:40, opacity:0 }, { x:0, opacity:1, duration:.6, ease:'power3.out', delay:.1 });
    gsap.fromTo([this.emailRef.nativeElement, this.passRef.nativeElement],
      { x:20, opacity:0 }, { x:0, opacity:1, duration:.4, stagger:.07, ease:'power2.out', delay:.3 });
    gsap.fromTo(this.oauthRef.nativeElement, { y:20, opacity:0 }, { y:0, opacity:1, duration:.35, ease:'power2.out', delay:.5 });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => {
        gsap.to(this.formBoxRef.nativeElement, { opacity:0, y:-30, duration:.4, ease:'power2.in',
          onComplete: () => this.router.navigate(['/dashboard']) });
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Invalid credentials');
        gsap.fromTo(this.formBoxRef.nativeElement, { x:-10 }, { x:0, duration:.4, ease:'elastic.out(1,.3)' });
      }
    });
  }
}
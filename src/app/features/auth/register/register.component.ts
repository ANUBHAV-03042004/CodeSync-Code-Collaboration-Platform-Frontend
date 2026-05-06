import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="page" #page>

  <!-- Animated corner splashes -->
  <div class="splash sp-tl" #sp1></div>
  <div class="splash sp-tr" #sp2></div>
  <div class="splash sp-bl" #sp3></div>
  <div class="splash sp-br" #sp4></div>

  <!-- Floating ticker tape -->
  <div class="ticker" #ticker>
    <div class="ticker-inner">
      <span *ngFor="let w of tickerWords">{{ w }} &nbsp;·&nbsp; </span>
      <span *ngFor="let w of tickerWords">{{ w }} &nbsp;·&nbsp; </span>
    </div>
  </div>

  <div class="card" #card>

    <!-- Top colour bar -->
    <div class="top-bar">
      <div class="tb tb-R"></div>
      <div class="tb tb-B"></div>
      <div class="tb tb-G"></div>
      <div class="tb tb-Y"></div>
    </div>

    <!-- Card header -->
    <div class="card-head" #head>
      <div class="logo-wrap">
        <div class="logo-bolt">⚡</div>
      </div>
      <div class="head-text">
        <h1 class="head-title">CREATE ACCOUNT</h1>
        <p class="head-sub">Join thousands of developers collaborating in real-time</p>
      </div>
    </div>

    <!-- OAuth buttons -->
    <div class="oauth-section">
      <button type="button" class="oauth-btn oauth-google" (click)="loginWithGoogle()" [disabled]="loading">
        <svg class="oauth-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <span>CONTINUE WITH GOOGLE</span>
      </button>
      <button type="button" class="oauth-btn oauth-github" (click)="loginWithGithub()" [disabled]="loading">
        <svg class="oauth-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        <span>CONTINUE WITH GITHUB</span>
      </button>
      <div class="oauth-divider">
        <div class="div-line"></div>
        <span class="div-text">OR REGISTER WITH EMAIL</span>
        <div class="div-line"></div>
      </div>
    </div>

    <!-- Step pills -->
    <div class="steps" #steps>
      <div class="step-pill" [class.done]="stepDone(0)" [class.active]="currentStep===0">
        <span class="sp-num">1</span><span class="sp-lbl">Identity</span>
      </div>
      <div class="step-line"></div>
      <div class="step-pill" [class.done]="stepDone(1)" [class.active]="currentStep===1">
        <span class="sp-num">2</span><span class="sp-lbl">Contact</span>
      </div>
      <div class="step-line"></div>
      <div class="step-pill" [class.done]="stepDone(2)" [class.active]="currentStep===2">
        <span class="sp-num">3</span><span class="sp-lbl">Security</span>
      </div>
    </div>

    <!-- Form body -->
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-body">

      <!-- Step 0 — Identity -->
      <div class="step-panel" *ngIf="currentStep === 0" #panel>
        <div class="panel-label red-label">STEP 1 — IDENTITY</div>
        <div class="field">
          <label class="flbl">Username <span class="req red">*</span></label>
          <div class="input-wrap">
             <span class="input-icon">&#64;</span>
            <input type="text" formControlName="username" placeholder="your_username"
              class="nb-input" [class.err-border]="touched('username')" />
          </div>
          <div class="err-msg" *ngIf="touched('username')">3–30 characters required</div>
        </div>
        <div class="field">
          <label class="flbl">Full Name</label>
          <div class="input-wrap">
            <span class="input-icon">✦</span>
            <input type="text" formControlName="fullName" placeholder="Jane Doe" class="nb-input" />
          </div>
        </div>
        <button type="button" class="nb-btn btn-blue next-btn" (click)="goNext(0)"
          [disabled]="form.get('username')?.invalid">
          NEXT — CONTACT INFO →
        </button>
      </div>

      <!-- Step 1 — Contact -->
      <div class="step-panel" *ngIf="currentStep === 1" #panel>
        <div class="panel-label blue-label">STEP 2 — CONTACT</div>
        <div class="field">
          <label class="flbl">Email Address <span class="req blue">*</span></label>
          <div class="input-wrap">
            <span class="input-icon">✉</span>
            <input type="email" formControlName="email" placeholder="you@example.com"
              class="nb-input" [class.err-border]="touched('email')" />
          </div>
          <div class="err-msg" *ngIf="touched('email')">Valid email required</div>
        </div>
        <div class="btn-row">
          <button type="button" class="nb-btn btn-outline back-btn" (click)="currentStep=0">← BACK</button>
          <button type="button" class="nb-btn btn-green next-btn" (click)="goNext(1)"
            [disabled]="form.get('email')?.invalid">
            NEXT — SECURITY →
          </button>
        </div>
      </div>

      <!-- Step 2 — Security -->
      <div class="step-panel" *ngIf="currentStep === 2" #panel>
        <div class="panel-label green-label">STEP 3 — SECURITY</div>
        <div class="field">
          <label class="flbl">Password <span class="req green">*</span></label>
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input type="password" formControlName="password" placeholder="Min 8 characters"
              class="nb-input" [class.err-border]="touched('password')" />
          </div>
          <!-- Strength bar -->
          <div class="strength-row">
            <div class="str-track">
              <div class="str-fill" [style.width]="pwWidth" [style.background]="pwColor"></div>
            </div>
            <span class="str-lbl" [style.color]="pwColor">{{ pwLabel }}</span>
          </div>
          <div class="err-msg" *ngIf="touched('password')">Minimum 8 characters</div>
        </div>

        <!-- Summary card -->
        <div class="summary-card" *ngIf="!loading">
          <div class="sum-row">
            <span class="sum-key">USERNAME</span>
            <span class="sum-val red-val">{{ form.value.username || '—' }}</span>
          </div>
          <div class="sum-divider"></div>
          <div class="sum-row">
            <span class="sum-key">FULL NAME</span>
            <span class="sum-val blue-val">{{ form.value.fullName || '—' }}</span>
          </div>
          <div class="sum-divider"></div>
          <div class="sum-row">
            <span class="sum-key">EMAIL</span>
            <span class="sum-val green-val">{{ form.value.email || '—' }}</span>
          </div>
        </div>

        <div class="btn-row">
          <button type="button" class="nb-btn btn-outline back-btn" (click)="currentStep=1">← BACK</button>
          <button type="submit" class="nb-btn btn-yellow submit-btn" [disabled]="loading || form.get('password')?.invalid">
            <span *ngIf="!loading">CREATE ACCOUNT ✦</span>
            <span *ngIf="loading" class="spinner-txt">Creating…</span>
          </button>
        </div>
      </div>

    </form>

    <!-- Bottom footer -->
    <div class="card-foot">
      <span>Already have an account?</span>
      <a routerLink="/login" class="foot-link">SIGN IN →</a>
    </div>

  </div>
</div>
  `,
  styles: [`
    /* ── Page ──────────────────────────────────────────────────────────────── */
    .page {
      min-height: 100vh;
      background: #F5F5F5;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 40px 16px;
    }

    /* ── Corner splashes ───────────────────────────────────────────────────── */
    .splash {
      position: absolute;
      width: 380px; height: 380px;
      border: 4px solid #000;
      opacity: 0.14;
      pointer-events: none;
    }
    .sp-tl { background: #E53935; top: -160px; left: -160px; transform: rotate(22deg); }
    .sp-tr { background: #1E88E5; top: -120px; right: -140px; transform: rotate(-18deg); }
    .sp-bl { background: #43A047; bottom: -140px; left: -120px; transform: rotate(-12deg); }
    .sp-br { background: #FDD835; bottom: -160px; right: -160px; transform: rotate(28deg); }

    /* ── Ticker ────────────────────────────────────────────────────────────── */
    .ticker {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #000;
      color: #FDD835;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      height: 28px;
      display: flex;
      align-items: center;
      z-index: 999;
    }
    .ticker-inner {
      display: inline-flex;
      animation: marquee 18s linear infinite;
      will-change: transform;
    }
    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    /* ── Card ──────────────────────────────────────────────────────────────── */
    .card {
      background: #fff;
      border: 4px solid #000;
      box-shadow: 8px 8px 0 #000;
      width: 100%;
      max-width: 500px;
      position: relative;
      z-index: 1;
      margin-top: 28px;
    }

    /* ── Top colour bar ────────────────────────────────────────────────────── */
    .top-bar { display: flex; height: 10px; }
    .tb { flex: 1; }
    .tb-R { background: #E53935; }
    .tb-B { background: #1E88E5; }
    .tb-G { background: #43A047; }
    .tb-Y { background: #FDD835; }

    /* ── Card header ───────────────────────────────────────────────────────── */
    .card-head {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 28px 20px;
      background: #000;
      border-bottom: 4px solid #000;
    }
    .logo-wrap {
      width: 54px; height: 54px;
      background: #FDD835;
      border: 3px solid #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-bolt { font-size: 30px; }
    .head-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 34px;
      letter-spacing: 3px;
      color: #fff;
      margin: 0;
      line-height: 1;
    }
    .head-sub {
      color: rgba(255,255,255,0.5);
      font-size: 12px;
      font-family: 'Space Mono', monospace;
      margin: 5px 0 0;
    }

    /* ── Step pills ────────────────────────────────────────────────────────── */
    .steps {
      display: flex;
      align-items: center;
      padding: 18px 28px;
      border-bottom: 3px solid #000;
      background: #FAFAFA;
      gap: 0;
    }
    .step-pill {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      border: 2px solid #000;
      background: #fff;
      transition: background 0.2s, box-shadow 0.2s;
    }
    .step-pill.active { background: #000; box-shadow: 3px 3px 0 #555; }
    .step-pill.active .sp-num, .step-pill.active .sp-lbl { color: #FDD835; }
    .step-pill.done { background: #43A047; }
    .step-pill.done .sp-num, .step-pill.done .sp-lbl { color: #fff; }
    .sp-num {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      color: #000;
      line-height: 1;
    }
    .sp-lbl {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #555;
    }
    .step-line { flex: 1; height: 3px; background: #000; }

    /* ── Form body ─────────────────────────────────────────────────────────── */
    .form-body { padding: 28px 28px 0; }
    .step-panel { display: flex; flex-direction: column; gap: 18px; }
    .panel-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      font-family: 'Space Mono', monospace;
      padding: 6px 12px;
      border: 2px solid #000;
      display: inline-block;
      width: fit-content;
    }
    .red-label   { background: #E53935; color: #fff; }
    .blue-label  { background: #1E88E5; color: #fff; }
    .green-label { background: #43A047; color: #fff; }

    /* ── Fields ────────────────────────────────────────────────────────────── */
    .field { display: flex; flex-direction: column; gap: 7px; }
    .flbl {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-family: 'Space Mono', monospace;
    }
    .req { font-size: 13px; }
    .req.red   { color: #E53935; }
    .req.blue  { color: #1E88E5; }
    .req.green { color: #43A047; }
    .input-wrap {
      display: flex;
      align-items: center;
      border: 3px solid #000;
      box-shadow: 3px 3px 0 #000;
      background: #fff;
      transition: box-shadow 0.15s;
    }
    .input-wrap:focus-within { box-shadow: 5px 5px 0 #1E88E5; }
    .input-icon {
      padding: 0 12px;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      background: #000;
      height: 100%;
      min-height: 46px;
      display: flex;
      align-items: center;
      border-right: 3px solid #000;
      flex-shrink: 0;
    }
    .nb-input {
      flex: 1;
      border: none;
      outline: none;
      padding: 12px 14px;
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      color: #000;
      background: transparent;
    }
    .nb-input.err-border { background: #FFF5F5; }
    .err-msg {
      font-size: 11px;
      font-family: 'Space Mono', monospace;
      color: #E53935;
      font-weight: 700;
    }

    /* ── Strength bar ──────────────────────────────────────────────────────── */
    .strength-row { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
    .str-track {
      flex: 1;
      height: 6px;
      background: #eee;
      border: 2px solid #000;
    }
    .str-fill { height: 100%; transition: width 0.4s, background 0.4s; }
    .str-lbl {
      font-size: 11px;
      font-weight: 800;
      font-family: 'Space Mono', monospace;
      min-width: 56px;
      text-align: right;
    }

    /* ── Summary card ──────────────────────────────────────────────────────── */
    .summary-card {
      background: #FAFAFA;
      border: 3px solid #000;
      padding: 14px 16px;
      margin-top: 4px;
    }
    .sum-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
    .sum-key {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      font-family: 'Space Mono', monospace;
      color: #888;
    }
    .sum-val { font-size: 13px; font-weight: 800; font-family: 'Space Mono', monospace; }
    .red-val   { color: #E53935; }
    .blue-val  { color: #1E88E5; }
    .green-val { color: #43A047; }
    .sum-divider { height: 1px; background: #ddd; margin: 4px 0; }

    /* ── Buttons ───────────────────────────────────────────────────────────── */
    .nb-btn {
      border: 3px solid #000;
      box-shadow: 4px 4px 0 #000;
      padding: 12px 20px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .nb-btn:hover   { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #000; }
    .nb-btn:active  { transform: translate(2px,2px);   box-shadow: 1px 1px 0 #000; }
    .nb-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 4px 4px 0 #000; }
    .btn-blue    { background: #1E88E5; color: #fff; }
    .btn-green   { background: #43A047; color: #fff; }
    .btn-yellow  { background: #FDD835; color: #000; }
    .btn-outline { background: #fff;    color: #000; }
    .next-btn  { width: 100%; margin-top: 4px; padding: 14px; font-size: 14px; }
    .submit-btn { flex: 1; padding: 14px; font-size: 14px; }
    .back-btn  { padding: 12px 18px; }
    .btn-row   { display: flex; gap: 10px; align-items: center; margin-top: 4px; }
    .spinner-txt { animation: blink 1s step-start infinite; }
    @keyframes blink { 50% { opacity: 0.4; } }

    /* ── OAuth ─────────────────────────────────────────────────────────────── */
    .oauth-section {
      padding: 20px 28px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .oauth-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 13px 20px;
      border: 3px solid #000;
      box-shadow: 4px 4px 0 #000;
      font-family: 'Space Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .oauth-btn:hover   { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #000; }
    .oauth-btn:active  { transform: translate(2px,2px);   box-shadow: 1px 1px 0 #000; }
    .oauth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 4px 4px 0 #000; }
    .oauth-google { background: #fff; color: #000; }
    .oauth-github { background: #000; color: #fff; }
    .oauth-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .oauth-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 6px 0 0;
    }
    .div-line { flex: 1; height: 2px; background: #000; }
    .div-text {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #888;
      white-space: nowrap;
    }

    /* ── Card footer ───────────────────────────────────────────────────────── */
    .card-foot {
      margin-top: 24px;
      padding: 16px 28px;
      background: #F0F0F0;
      border-top: 3px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 12px;
      font-family: 'Space Mono', monospace;
    }
    .foot-link {
      font-weight: 800;
      color: #1E88E5;
      text-decoration: none;
      border-bottom: 2px solid #1E88E5;
      padding-bottom: 1px;
      letter-spacing: 0.5px;
    }
    .foot-link:hover { color: #E53935; border-color: #E53935; }
  `]
})
export class RegisterComponent implements OnInit, AfterViewInit {
  @ViewChild('card')   cardRef!: ElementRef;
  @ViewChild('head')   headRef!: ElementRef;
  @ViewChild('steps')  stepsRef!: ElementRef;
  @ViewChild('sp1') sp1!: ElementRef; @ViewChild('sp2') sp2!: ElementRef;
  @ViewChild('sp3') sp3!: ElementRef; @ViewChild('sp4') sp4!: ElementRef;
  @ViewChild('ticker') tickerRef!: ElementRef;

  private fb   = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private toast  = inject(ToastService);

  form!: FormGroup;
  loading    = false;
  currentStep = 0;
  pwWidth  = '0%';
  pwColor  = '#999';
  pwLabel  = '';

  tickerWords = [
    'YOURSCODE', 'COLLABORATE', 'BUILD TOGETHER', 'REAL-TIME CODE',
    'SHIP FASTER', 'JOIN NOW', 'FREE TO START', 'OPEN SOURCE'
  ];

  /** backward-compat getter used by tests */
  get strengthClass(): string {
    if (this.pwWidth === '0%')   return 'empty';
    if (this.pwWidth === '33%')  return 'weak';
    if (this.pwWidth === '66%')  return 'medium';
    return 'strong';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      fullName: [''],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
    this.form.get('password')?.valueChanges.subscribe(v => this.updateStrength(v));
  }

  ngAfterViewInit(): void {
    // Splash corners pop in
    gsap.fromTo([this.sp1.nativeElement, this.sp2.nativeElement, this.sp3.nativeElement, this.sp4.nativeElement],
      { scale: 0, rotation: 0 },
      { scale: 1, duration: 0.7, stagger: 0.1, ease: 'back.out(1.5)' });

    // Card slam in from below
    gsap.fromTo(this.cardRef.nativeElement,
      { y: 90, opacity: 0, rotate: -1.5 },
      { y: 0, opacity: 1, rotate: 0, duration: 0.65, ease: 'power4.out', delay: 0.25 });

    // Header slides in
    gsap.fromTo(this.headRef.nativeElement,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.6 });

    // Steps bounce in
    gsap.fromTo(this.stepsRef.nativeElement.querySelectorAll('.step-pill'),
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.09, ease: 'back.out(1.4)', delay: 0.75 });
  }

  loginWithGoogle(): void { this.auth.loginWithGoogle(); }
  loginWithGithub(): void { this.auth.loginWithGithub(); }

  touched(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  stepDone(step: number): boolean { return this.currentStep > step; }

  goNext(step: number): void {
    const fieldMap = ['username', 'email'];
    const ctrl = this.form.get(fieldMap[step]);
    if (ctrl?.invalid) { ctrl.markAsTouched(); return; }
    this.currentStep = step + 1;
    // Animate new panel in
    setTimeout(() => {
      const panel = document.querySelector('.step-panel');
      if (panel) {
        gsap.fromTo(panel, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
      }
    }, 10);
  }

  updateStrength(pass: string): void {
    if (!pass) { this.pwWidth = '0%'; this.pwColor = '#999'; this.pwLabel = ''; return; }
    const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/, /.{12,}/].filter(r => r.test(pass)).length;
    if (pass.length < 8)   { this.pwWidth = '33%'; this.pwColor = '#E53935'; this.pwLabel = 'Weak'; }
    else if (score <= 1)   { this.pwWidth = '33%'; this.pwColor = '#E53935'; this.pwLabel = 'Weak'; }
    else if (score <= 2)   { this.pwWidth = '66%'; this.pwColor = '#FDD835'; this.pwLabel = 'Fair'; }
    else                   { this.pwWidth = '100%'; this.pwColor = '#43A047'; this.pwLabel = 'Strong'; }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const { username, email, password, fullName } = this.form.value;
    this.auth.register(username, email, password, fullName).subscribe({
      next: () => {
        this.toast.success('Account created! Please sign in.');
        this.ngZone.run(() => this.router.navigate(['/login']));
      },
      error: (err: any) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Registration failed');
        gsap.fromTo(this.cardRef.nativeElement,
          { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.2)' });
      }
    });
  }
}
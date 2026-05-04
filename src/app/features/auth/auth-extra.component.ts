import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

const CARD_STYLES = [`
  .auth-page { min-height:100vh;background:var(--O);display:flex;align-items:center;justify-content:center;padding:60px 24px; }
  .auth-card { width:100%;max-width:420px;border:3px solid var(--K);background:var(--W);box-shadow:8px 8px 0 var(--K);padding:40px; }
  .stripe { height:6px;border:2px solid var(--K);display:flex;margin-bottom:28px;overflow:hidden; }
  .stripe div { flex:1; }
  h2 { font-family:'Bebas Neue',sans-serif;font-size:38px;letter-spacing:.05em;margin-bottom:6px; }
  .sub { color:#777;font-size:14px;margin-bottom:28px;font-weight:500; }
  .field { display:flex;flex-direction:column;gap:6px;margin-bottom:18px; }
  .field label { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.09em; }
  .field input { border:3px solid var(--K);background:var(--O);padding:12px 14px;font-family:'Space Grotesk',sans-serif;font-size:14px;color:var(--K);outline:none;box-shadow:3px 3px 0 var(--K); }
  .field input:focus { box-shadow:5px 5px 0 var(--B);border-color:var(--B); }
  .btn { display:inline-flex;align-items:center;justify-content:center;width:100%;padding:14px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;letter-spacing:.04em;text-transform:uppercase;border:3px solid var(--K);cursor:pointer;box-shadow:5px 5px 0 var(--K);transition:transform .08s,box-shadow .08s; }
  .btn:hover { transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--K); }
  .btn:disabled { opacity:.55;cursor:not-allowed; }
  .btn-Y { background:var(--Y);color:var(--K); }
  .btn-G { background:var(--G);color:var(--K); }
  .success-box { background:var(--G);border:3px solid var(--K);box-shadow:3px 3px 0 var(--K);padding:16px 18px;font-weight:700;font-size:14px;letter-spacing:.03em;margin-bottom:16px; }
  .auth-foot { margin-top:20px;font-size:13px;color:#777;font-weight:500; }
  .auth-foot a { color:var(--B);font-weight:700;text-decoration:underline;cursor:pointer; }
  .err-msg { color:var(--R);font-weight:700;font-size:14px;margin-bottom:16px; }
`];

// ── OAuth2 Callback ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;background:var(--K)">
      <div class="spin-box"></div>
      <div class="oauth-label bb">Completing Sign-In…</div>
    </div>
  `,
  styles: [`.spin-box{width:60px;height:60px;border:4px solid rgba(255,255,240,.15);border-top:4px solid var(--Y);animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .oauth-label{font-size:24px;letter-spacing:.08em;color:rgba(255,255,240,.5)}`]
})
export class Oauth2CallbackComponent implements OnInit {
  // ActivatedRoute not needed anymore — token is in the URL fragment (#), not query params
  private router = inject(Router);

  ngOnInit(): void {
    // Backend sends: /oauth2/callback#token=xxx&refreshToken=yyy
    // window.location.hash gives us "#token=xxx&refreshToken=yyy"
    const fragment = window.location.hash; // e.g. "#token=eyJ...&refreshToken=eyJ..."
    const params = new URLSearchParams(fragment.startsWith('#') ? fragment.substring(1) : fragment);

    const token        = params.get('token');
    const refreshToken = params.get('refreshToken');

    if (token) {
      localStorage.setItem('access_token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          localStorage.setItem('user', JSON.stringify({
            email: payload.sub,
            role: payload.role
          }));
        }
      } catch { /* malformed JWT — still proceed, profile will load from API */ }
      this.router.navigate(['/dashboard']);
    } else {
      // No token in fragment — OAuth failed or user cancelled
      this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } });
    }
  }
}

// ── Forgot Password ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="fp-shell">

      <!-- LEFT PANEL — brand/visual -->
      <div class="fp-left" #fpLeft>
        <!-- Corner deco blocks -->
        <div class="deco deco-tl"></div>
        <div class="deco deco-br"></div>

        <!-- Top label strip -->
        <div class="fp-label-strip">
          <span class="fp-label-dot"></span>
          <span class="fp-label-text">ACCOUNT RECOVERY</span>
        </div>

        <!-- Big title -->
        <div class="fp-big-title" #fpTitle>
          <span class="fbt-line fbt-forgot">FORGOT</span>
          <span class="fbt-line fbt-your">YOUR</span>
          <span class="fbt-line fbt-pass">PASS?</span>
        </div>

        <p class="fp-tagline" #fpTagline>
          No stress — enter your email and we'll fire a reset link straight to your inbox.
        </p>

        <!-- Step pill row -->
        <div class="fp-steps" #fpSteps>
          <div class="fp-step">
            <div class="fp-step-num sn-Y">1</div>
            <div class="fp-step-text">Enter email</div>
          </div>
          <div class="fp-step-arrow">→</div>
          <div class="fp-step">
            <div class="fp-step-num sn-B">2</div>
            <div class="fp-step-text">Check inbox</div>
          </div>
          <div class="fp-step-arrow">→</div>
          <div class="fp-step">
            <div class="fp-step-num sn-G">3</div>
            <div class="fp-step-text">Set new password</div>
          </div>
        </div>

        <!-- Color bar -->
        <div class="fp-color-bar" #fpBar>
          <div class="fcb fcb-R"></div>
          <div class="fcb fcb-B"></div>
          <div class="fcb fcb-G"></div>
          <div class="fcb fcb-Y"></div>
        </div>
      </div>

      <!-- RIGHT PANEL — form -->
      <div class="fp-right" #fpRight>

        <!-- back link -->
        <a routerLink="/login" class="fp-back" #fpBack>← Back to Sign In</a>

        <!-- Brand mark -->
        <div class="fp-brand" #fpBrand>
          <div class="fp-bolt">⚡</div>
          <span class="fp-brand-name">Yours<span class="fp-brand-y">CODE</span></span>
        </div>

        <!-- Card -->
        <div class="fp-card" #fpCard>

          <!-- Success state -->
          <div class="fp-success" *ngIf="sent" #fpSuccess>
            <div class="fp-success-icon">✅</div>
            <h2 class="fp-success-title bb">LINK SENT!</h2>
            <p class="fp-success-msg">
              Check <strong>{{ sentEmail }}</strong> for your reset link.
              It expires in 15 minutes.
            </p>
            <a routerLink="/login" class="fp-btn fp-btn-G" style="text-decoration:none;display:flex">
              ← Back to Sign In
            </a>
            <button class="fp-resend-link" (click)="resend()">Didn't get it? Resend →</button>
          </div>

          <!-- Form state -->
          <div *ngIf="!sent">
            <h2 class="bb fp-form-title">RESET<br>PASSWORD</h2>
            <p class="fp-form-sub">We'll send a secure link to your email address.</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="fp-field" #fpField>
                <label class="fp-label">Email Address</label>
                <div class="fp-input-wrap">
                  <span class="fp-input-icon">&#64;</span>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="you@example.com"
                    class="fp-input"
                    [class.fp-input-err]="form.get('email')?.invalid && form.get('email')?.touched"
                  />
                </div>
                <span class="fp-err" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
                  Please enter a valid email address
                </span>
              </div>

              <button
                type="submit"
                class="fp-btn fp-btn-Y"
                [disabled]="loading"
                #fpSubmit
              >
                <span *ngIf="!loading">SEND RESET LINK →</span>
                <span *ngIf="loading" class="fp-loading-row">
                  <span class="fp-spinner"></span> SENDING…
                </span>
              </button>
            </form>

            <div class="fp-divider">
              <span class="fp-div-line"></span>
              <span class="fp-div-text">OR</span>
              <span class="fp-div-line"></span>
            </div>

            <div class="fp-alt-links">
              <a routerLink="/login"    class="fp-alt-btn fp-alt-K">SIGN IN INSTEAD</a>
              <a routerLink="/register" class="fp-alt-btn fp-alt-B">CREATE ACCOUNT</a>
            </div>
          </div>
        </div>

        <!-- Bottom note -->
        <p class="fp-note" #fpNote>
          Link expires after <strong>15 minutes</strong>. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  `,
  styles: [`
    /* ── CSS variables (matching global neobrutalism palette) ── */
    :host {
      --R: #FF2D2D; --B: #1A6FFF; --G: #00C853; --Y: #FFD600;
      --K: #0A0A0A; --W: #FFFFF0; --O: #F2F0E3;
      display: block;
    }

    /* ── Shell: full-screen split ── */
    .fp-shell {
      display: flex;
      min-height: 100vh;
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
    }

    /* ═══════════════ LEFT PANEL ═══════════════ */
    .fp-left {
      flex: 0 0 48%;
      background: var(--K);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px 52px;
      position: relative;
      overflow: hidden;
      border-right: 4px solid var(--Y);
    }

    /* Corner deco squares */
    .deco { position: absolute; border: 4px solid rgba(255,255,255,.08); }
    .deco-tl { top: -40px; left: -40px; width: 180px; height: 180px; transform: rotate(15deg); background: var(--Y); opacity: .06; }
    .deco-br { bottom: -60px; right: -50px; width: 240px; height: 240px; transform: rotate(-12deg); background: var(--B); opacity: .07; }

    /* Label strip */
    .fp-label-strip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--Y);
      border: 2px solid var(--W);
      padding: 5px 14px;
      margin-bottom: 32px;
      width: fit-content;
      position: relative;
      z-index: 1;
    }
    .fp-label-dot { width: 8px; height: 8px; background: var(--K); border: 1px solid var(--K); flex-shrink: 0; }
    .fp-label-text { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--K); }

    /* Big title */
    .fp-big-title {
      display: flex;
      flex-direction: column;
      margin-bottom: 28px;
      position: relative;
      z-index: 1;
    }
    .fbt-line {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 96px;
      letter-spacing: .03em;
      line-height: .88;
      display: block;
    }
    .fbt-forgot { color: var(--R); }
    .fbt-your   { color: var(--W); }
    .fbt-pass   { color: var(--Y); -webkit-text-stroke: 2px var(--Y); }

    /* Tagline */
    .fp-tagline {
      color: rgba(255,255,240,.55);
      font-size: 14px;
      line-height: 1.65;
      max-width: 340px;
      margin-bottom: 36px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    /* Steps row */
    .fp-steps {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    .fp-step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .fp-step-num {
      width: 40px; height: 40px;
      border: 3px solid var(--W);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 22px;
    }
    .sn-Y { background: var(--Y); color: var(--K); border-color: var(--Y); }
    .sn-B { background: var(--B); color: var(--W); border-color: var(--B); }
    .sn-G { background: var(--G); color: var(--K); border-color: var(--G); }
    .fp-step-text { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,240,.5); white-space: nowrap; }
    .fp-step-arrow { color: var(--Y); font-size: 20px; font-weight: 900; margin-bottom: 16px; }

    /* Color bar */
    .fp-color-bar {
      display: flex;
      border: 3px solid rgba(255,255,255,.2);
      overflow: hidden;
      width: 160px;
      position: relative;
      z-index: 1;
    }
    .fcb { height: 12px; flex: 1; }
    .fcb-R { background: var(--R); }
    .fcb-B { background: var(--B); }
    .fcb-G { background: var(--G); }
    .fcb-Y { background: var(--Y); }

    /* ═══════════════ RIGHT PANEL ═══════════════ */
    .fp-right {
      flex: 1;
      background: var(--O);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 52px;
      position: relative;
    }

    /* Back link */
    .fp-back {
      position: absolute;
      top: 28px; left: 40px;
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .08em;
      color: var(--K); text-decoration: none;
      border-bottom: 2px solid var(--K);
      padding-bottom: 2px;
      transition: color .15s, border-color .15s;
    }
    .fp-back:hover { color: var(--B); border-color: var(--B); }

    /* Brand mark */
    .fp-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .fp-bolt {
      width: 38px; height: 38px;
      background: var(--Y);
      border: 3px solid var(--K);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      box-shadow: 3px 3px 0 var(--K);
    }
    .fp-brand-name { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: .08em; color: var(--K); }
    .fp-brand-y { color: var(--Y); -webkit-text-stroke: 1px var(--K); }

    /* Main card */
    .fp-card {
      width: 100%;
      max-width: 400px;
      background: var(--W);
      border: 3px solid var(--K);
      box-shadow: 8px 8px 0 var(--K);
      padding: 36px 32px;
    }

    /* Form title */
    .fp-form-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 48px; letter-spacing: .05em;
      line-height: .9;
      margin: 0 0 10px;
      color: var(--K);
    }
    .fp-form-sub {
      font-size: 13px; color: #777;
      font-weight: 500; margin: 0 0 26px;
      line-height: 1.5;
    }

    /* Field */
    .fp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .fp-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--K); }
    .fp-input-wrap { display: flex; align-items: center; border: 3px solid var(--K); background: var(--O); box-shadow: 3px 3px 0 var(--K); transition: box-shadow .1s, border-color .1s; }
    .fp-input-wrap:focus-within { box-shadow: 5px 5px 0 var(--B); border-color: var(--B); }
    .fp-input-icon { padding: 0 12px; font-size: 14px; font-weight: 800; color: #aaa; border-right: 2px solid var(--K); height: 100%; display: flex; align-items: center; font-family: 'Space Grotesk', sans-serif; }
    .fp-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 13px 14px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 14px; color: var(--K);
      outline: none;
    }
    .fp-input::placeholder { color: #bbb; }
    .fp-input-err { border-color: var(--R) !important; }
    .fp-err { color: var(--R); font-size: 12px; font-weight: 700; letter-spacing: .02em; }

    /* Primary button */
    .fp-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 15px;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: .06em;
      text-transform: uppercase;
      border: 3px solid var(--K);
      cursor: pointer;
      box-shadow: 5px 5px 0 var(--K);
      transition: transform .08s, box-shadow .08s;
      text-decoration: none;
    }
    .fp-btn:hover:not(:disabled) { transform: translate(-2px,-2px); box-shadow: 8px 8px 0 var(--K); }
    .fp-btn:active:not(:disabled) { transform: translate(3px,3px); box-shadow: 1px 1px 0 var(--K); }
    .fp-btn:disabled { opacity: .55; cursor: not-allowed; }
    .fp-btn-Y { background: var(--Y); color: var(--K); }
    .fp-btn-G { background: var(--G); color: var(--K); }

    /* Loading spinner inside button */
    .fp-loading-row { display: flex; align-items: center; gap: 10px; }
    .fp-spinner {
      width: 16px; height: 16px;
      border: 3px solid rgba(0,0,0,.2);
      border-top-color: var(--K);
      border-radius: 50%;
      animation: fp-spin .7s linear infinite;
    }
    @keyframes fp-spin { to { transform: rotate(360deg); } }

    /* Divider */
    .fp-divider {
      display: flex; align-items: center; gap: 10px;
      font-size: 11px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .1em;
      color: #bbb; margin: 20px 0;
    }
    .fp-div-line { flex: 1; height: 2px; background: var(--K); }

    /* Alt links */
    .fp-alt-links { display: flex; gap: 10px; }
    .fp-alt-btn {
      flex: 1;
      display: flex; align-items: center; justify-content: center;
      padding: 11px 10px;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700; font-size: 12px;
      letter-spacing: .05em; text-transform: uppercase;
      border: 2px solid var(--K);
      box-shadow: 3px 3px 0 var(--K);
      text-decoration: none;
      transition: transform .08s, box-shadow .08s, background .1s;
    }
    .fp-alt-btn:hover { transform: translate(-1px,-1px); box-shadow: 5px 5px 0 var(--K); }
    .fp-alt-K { background: var(--K); color: var(--W); }
    .fp-alt-B { background: var(--B); color: var(--W); }

    /* ── Success State ── */
    .fp-success { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
    .fp-success-icon { font-size: 48px; animation: fp-bounce .5s ease; }
    @keyframes fp-bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
    .fp-success-title { font-family: 'Bebas Neue', sans-serif; font-size: 40px; letter-spacing: .06em; color: var(--G); margin: 0; }
    .fp-success-msg { font-size: 14px; color: #555; line-height: 1.6; margin: 0; }
    .fp-success-msg strong { color: var(--K); font-weight: 800; }
    .fp-resend-link {
      background: none; border: none;
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .07em;
      color: var(--B); text-decoration: underline;
      cursor: pointer; margin-top: 4px;
      transition: color .15s;
    }
    .fp-resend-link:hover { color: var(--K); }

    /* Bottom note */
    .fp-note {
      position: absolute;
      bottom: 24px;
      font-size: 12px; color: #aaa;
      font-weight: 500; text-align: center;
      max-width: 340px;
    }
    .fp-note strong { color: var(--K); font-weight: 800; }

    /* Responsive */
    @media (max-width: 860px) {
      .fp-shell { flex-direction: column; }
      .fp-left { flex: 0 0 auto; min-height: 260px; padding: 40px 28px; border-right: none; border-bottom: 4px solid var(--Y); }
      .fbt-line { font-size: 64px; }
      .fp-right { padding: 40px 24px 80px; }
      .fp-note { position: static; margin-top: 20px; }
    }
  `]
})
export class ForgotPasswordComponent implements AfterViewInit {
  @ViewChild('fpLeft')    fpLeft!:    ElementRef;
  @ViewChild('fpTitle')   fpTitle!:   ElementRef;
  @ViewChild('fpTagline') fpTagline!: ElementRef;
  @ViewChild('fpSteps')   fpSteps!:   ElementRef;
  @ViewChild('fpBar')     fpBar!:     ElementRef;
  @ViewChild('fpRight')   fpRight!:   ElementRef;
  @ViewChild('fpBack')    fpBack!:    ElementRef;
  @ViewChild('fpBrand')   fpBrand!:   ElementRef;
  @ViewChild('fpCard')    fpCard!:    ElementRef;
  @ViewChild('fpNote')    fpNote!:    ElementRef;
  @ViewChild('fpField')   fpField!:   ElementRef;
  @ViewChild('fpSubmit')  fpSubmit!:  ElementRef;

  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  form: FormGroup = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  loading   = false;
  sent      = false;
  sentEmail = '';

  ngAfterViewInit(): void {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      this.fpLeft.nativeElement.querySelectorAll('.fbt-line'),
      { x: -70, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, stagger: 0.1 }
    )
    .fromTo(
      this.fpLeft.nativeElement.querySelector('.fp-label-strip'),
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.4 }, '-=0.4'
    )
    .fromTo(this.fpTagline.nativeElement,
      { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.1'
    )
    .fromTo(
      this.fpSteps.nativeElement.querySelectorAll('.fp-step, .fp-step-arrow'),
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.06 }, '-=0.1'
    )
    .fromTo(this.fpBar.nativeElement,
      { scaleX: 0, transformOrigin: 'left' },
      { scaleX: 1, duration: 0.45 }, '-=0.15'
    )
    .fromTo(this.fpBack.nativeElement,
      { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.5'
    )
    .fromTo(this.fpBrand.nativeElement,
      { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.2'
    )
    .fromTo(this.fpCard.nativeElement,
      { y: 40, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }, '-=0.1'
    )
    .fromTo(
      [this.fpField?.nativeElement, this.fpSubmit?.nativeElement],
      { x: 16, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, stagger: 0.08 }, '-=0.25'
    )
    .fromTo(this.fpNote.nativeElement,
      { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.1'
    );

    gsap.to(this.fpBar.nativeElement, {
      y: -5, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      gsap.fromTo('.fp-input-wrap', { x: -7 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.sentEmail = this.form.value.email;
    this.auth.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.loading = false;
        this.sent    = true;
        this.toast.success('Reset link sent!');
      },
      error: () => {
        this.loading = false;
        this.toast.error('Could not send reset link.');
        gsap.fromTo(this.fpCard.nativeElement, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      }
    });
  }

  resend(): void {
    this.sent = false;
    this.form.reset();
    this.toast.success('You can submit again now.');
  }
}

// ── Reset Password ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="stripe">
          <div style="background:var(--G)"></div>
          <div style="background:var(--Y)"></div>
          <div style="background:var(--B)"></div>
          <div style="background:var(--R)"></div>
        </div>
        <h2 class="bb">New Password</h2>
        <ng-container *ngIf="tokenValid === null"><p class="sub">Validating token…</p></ng-container>
        <ng-container *ngIf="tokenValid === false">
          <p class="err-msg">This reset link is invalid or has expired.</p>
          <a routerLink="/forgot-password" class="btn btn-Y" style="text-decoration:none;display:flex">Request New Link</a>
        </ng-container>
        <ng-container *ngIf="tokenValid === true">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field">
              <label>New Password</label>
              <input type="password" formControlName="newPassword" placeholder="Min 8 characters" />
            </div>
            <button type="submit" class="btn btn-G" [disabled]="loading">
              {{ loading ? 'Resetting…' : 'Set New Password →' }}
            </button>
          </form>
        </ng-container>
        <div class="auth-foot"><a routerLink="/login">← Back to Sign In</a></div>
      </div>
    </div>
  `,
  styles: CARD_STYLES
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  form: FormGroup = this.fb.group({ newPassword: ['', [Validators.required, Validators.minLength(8)]] });
  loading = false;
  tokenValid: boolean | null = null;
  private token = '';
  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) { this.tokenValid = false; return; }
    this.auth.validateResetToken(this.token).subscribe({
      next: r => { this.tokenValid = r.valid; },
      error: () => { this.tokenValid = false; }
    });
  }
  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: () => { this.toast.success('Password reset! Please sign in.'); this.router.navigate(['/login']); },
      error: () => { this.loading = false; this.toast.error('Reset failed. Try requesting a new link.'); }
    });
  }
}
import { Component, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="home" #homeRef>

  <!-- Hero -->
  <section class="hero">
    <div class="hero-left">
      <div class="hero-eyebrow" #eyebrowRef>
        <div class="eye-dot"></div>
        <span>REAL-TIME COLLABORATION PLATFORM</span>
      </div>
      <h1 class="hero-title">
        <span class="ht-line ht-red"   #tl1>CODE</span>
        <span class="ht-line ht-blue"  #tl2>TOGETHER.</span>
        <span class="ht-line ht-green" #tl3>SHIP FASTER.</span>
      </h1>
      <p class="hero-body" #hbodyRef>
        CodeSync lets teams write, run, and review code in the same editor — simultaneously.
        Real-time cursors, instant execution, and built-in version history.
      </p>
      <div class="hero-cta" #ctaRef>
        <a routerLink="/register" class="nb-btn btn-red cta-main">START FOR FREE →</a>
        <a routerLink="/login"    class="nb-btn btn-outline">SIGN IN</a>
        <a routerLink="/dashboard" class="nb-btn btn-blue">OPEN DASHBOARD</a>
      </div>
      <div class="trust-row" #trustRef>
        <div class="trust-item">
          <span class="trust-num t-red">10K+</span>
          <span class="trust-lbl">Developers</span>
        </div>
        <div class="trust-div"></div>
        <div class="trust-item">
          <span class="trust-num t-blue">50K+</span>
          <span class="trust-lbl">Projects</span>
        </div>
        <div class="trust-div"></div>
        <div class="trust-item">
          <span class="trust-num t-green">99.9%</span>
          <span class="trust-lbl">Uptime</span>
        </div>
      </div>
    </div>

    <!-- Code window -->
    <div class="hero-right" #heroRightRef>
      <div class="code-window">
        <div class="cw-bar">
          <div class="cw-dot cw-red"></div>
          <div class="cw-dot cw-yellow"></div>
          <div class="cw-dot cw-green"></div>
          <span class="cw-title mono">main.py — CodeSync</span>
        </div>
        <div class="cw-body">
          <div class="code-line" *ngFor="let l of codeLines; let i = index">
            <span class="ln mono">{{ i+1 }}</span>
            <span class="code-text mono" [innerHTML]="l"></span>
          </div>
          <div class="cursor-wrap c1-wrap">
            <div class="cursor-flag cf-red">Alice</div>
            <div class="cursor-bar cb-red"></div>
          </div>
          <div class="cursor-wrap c2-wrap">
            <div class="cursor-flag cf-blue">Bob</div>
            <div class="cursor-bar cb-blue"></div>
          </div>
        </div>
      </div>
      <div class="badge-float bf1" #bf1Ref>✅ Tests passing</div>
      <div class="badge-float bf2" #bf2Ref>⚡ 3 online</div>
      <div class="badge-float bf3" #bf3Ref>🔒 Saved</div>
    </div>
  </section>

  <!-- Features -->
  <section class="feat-section">
    <div class="feat-heading">
      <h2 class="bb feat-title">EVERYTHING YOU NEED</h2>
      <div class="feat-stripe">
        <div style="background:var(--R)"></div>
        <div style="background:var(--B)"></div>
        <div style="background:var(--G)"></div>
        <div style="background:var(--Y)"></div>
      </div>
    </div>
    <div class="feat-grid" #featGridRef>
      <div class="feat-card" *ngFor="let f of featuresList; let i = index">
        <div class="feat-icon">{{ f.icon }}</div>
        <h3 class="feat-name bb">{{ f.name }}</h3>
        <p class="feat-desc">{{ f.desc }}</p>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="how-section">
    <h2 class="bb how-title">HOW IT WORKS</h2>
    <div class="how-steps">
      <div class="how-step" *ngFor="let s of stepsList; let i = index">
        <div class="how-num bb" [class]="'hn-' + s.color">{{ i+1 }}</div>
        <div class="how-content">
          <div class="how-name">{{ s.name }}</div>
          <div class="how-text mono">{{ s.text }}</div>
        </div>
        <div class="how-arrow" *ngIf="i < stepsList.length - 1">→</div>
      </div>
    </div>
  </section>

  <!-- Lang ticker -->
  <div class="lang-bar">
    <div class="lang-inner">
      <span class="lang-item" *ngFor="let l of langTicks">{{ l }}</span>
      <span class="lang-item" *ngFor="let l of langTicks">{{ l }}</span>
    </div>
  </div>

  <!-- CTA Banner -->
  <section class="cta-banner" #ctaBannerRef>
    <div class="banner-left">
      <h2 class="bb banner-title">READY TO BUILD?</h2>
      <p class="banner-sub mono">Free forever for open source. No credit card required.</p>
    </div>
    <div class="banner-btns">
      <a routerLink="/register" class="nb-btn btn-yellow banner-cta">CREATE FREE ACCOUNT →</a>
      <a routerLink="/login"    class="nb-btn btn-white-outline">SIGN IN</a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-brand">
      <div class="footer-bolt">⚡</div>
      <span class="footer-name bb">CODESYNC</span>
    </div>
    <div class="footer-links">
      <a routerLink="/login"     class="fl">Sign In</a>
      <a routerLink="/register"  class="fl">Register</a>
      <a routerLink="/dashboard" class="fl">Dashboard</a>
      <a routerLink="/projects"  class="fl">Projects</a>
    </div>
    <div class="footer-copy mono">© 2026 CodeSync. Built for developers.</div>
  </footer>

</div>
  `,
  styles: [`
    /* Base */
    .home { background: var(--W); min-height: 100vh; overflow-x: hidden; }

    /* Shared button */
    .nb-btn {
      border: 3px solid var(--K); box-shadow: var(--sh);
      padding: 12px 20px; font-family: 'Space Grotesk', sans-serif;
      font-size: 13px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .05em; cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center; gap: 6px;
      transition: transform .1s, box-shadow .1s;
    }
    .nb-btn:hover  { transform: translate(-2px,-2px); box-shadow: var(--sh-lg); }
    .nb-btn:active { transform: translate(2px,2px);   box-shadow: 2px 2px 0 var(--K); }
    .btn-red     { background: var(--R); color: var(--W); }
    .btn-blue    { background: var(--B); color: var(--W); }
    .btn-yellow  { background: var(--Y); color: var(--K); }
    .btn-outline { background: var(--W); color: var(--K); }
    .btn-white-outline { background: var(--W); color: var(--K); border-color: var(--W); box-shadow: 4px 4px 0 var(--W); }
    .btn-white-outline:hover { box-shadow: 6px 6px 0 var(--W); }

    /* Hero */
    .hero {
      display: grid; grid-template-columns: 1fr 1fr; gap: 48px;
      padding: 64px 40px; align-items: center; max-width: 1240px; margin: 0 auto;
    }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 10px;
      background: var(--K); color: var(--W);
      padding: 6px 14px; font-size: 10px; font-weight: 700;
      letter-spacing: .12em; margin-bottom: 20px; border: 2px solid var(--K);
      font-family: 'JetBrains Mono', monospace;
    }
    .eye-dot { width: 8px; height: 8px; background: var(--R); border: 1px solid var(--W); flex-shrink: 0; }
    .hero-title { margin: 0 0 20px; line-height: .93; }
    .ht-line {
      display: block; font-family: 'Bebas Neue', sans-serif;
      font-size: 92px; letter-spacing: .04em;
      border-bottom: 5px solid var(--K); padding-bottom: 4px; margin-bottom: 4px;
    }
    .ht-red   { color: var(--R); }
    .ht-blue  { color: var(--B); }
    .ht-green { color: var(--G); }
    .hero-body { font-size: 16px; line-height: 1.65; color: #444; margin: 0 0 28px; max-width: 480px; font-weight: 500; }
    .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
    .cta-main { font-size: 15px; padding: 15px 26px; }
    .trust-row { display: flex; align-items: center; gap: 24px; }
    .trust-item { display: flex; flex-direction: column; gap: 2px; }
    .trust-num { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: .04em; line-height: 1; }
    .trust-lbl { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #777; text-transform: uppercase; letter-spacing: .08em; }
    .trust-div { width: 3px; height: 36px; background: var(--K); }
    .t-red   { color: var(--R); }
    .t-blue  { color: var(--B); }
    .t-green { color: var(--G); }

    /* Code window */
    .hero-right { position: relative; }
    .code-window {
      background: #0d0d17; border: 4px solid var(--K); box-shadow: var(--sh-lg); overflow: hidden;
    }
    .cw-bar {
      background: var(--K); padding: 10px 16px;
      display: flex; align-items: center; gap: 8px; border-bottom: 3px solid #333;
    }
    .cw-dot { width: 10px; height: 10px; border: 1px solid rgba(255,255,255,.3); flex-shrink: 0; }
    .cw-red    { background: var(--R); }
    .cw-yellow { background: var(--Y); }
    .cw-green  { background: var(--G); }
    .cw-title { color: rgba(255,255,255,.45); font-size: 12px; margin-left: 8px; }
    .cw-body { padding: 20px; position: relative; min-height: 200px; }
    .code-line { display: flex; align-items: center; gap: 16px; margin-bottom: 6px; }
    .ln { color: #444; font-size: 12px; min-width: 18px; text-align: right; flex-shrink: 0; }
    .code-text { font-size: 13px; color: #e2e8f0; white-space: pre; }
    :host ::ng-deep .kw  { color: #818cf8; }
    :host ::ng-deep .fn  { color: #4ade80; }
    :host ::ng-deep .str { color: #fbbf24; }
    :host ::ng-deep .cm  { color: #64748b; }
    .cursor-wrap { position: absolute; display: flex; align-items: flex-start; }
    .c1-wrap { top: 50px; left: 100px; }
    .c2-wrap { top: 95px; left: 160px; }
    .cursor-flag {
      font-size: 10px; font-weight: 800; padding: 2px 6px; color: var(--W);
      white-space: nowrap; font-family: 'JetBrains Mono', monospace;
    }
    .cursor-bar { width: 2px; height: 18px; margin-top: 16px; }
    .cf-red  { background: var(--R); } .cb-red  { background: var(--R); }
    .cf-blue { background: var(--B); } .cb-blue { background: var(--B); }
    .badge-float {
      position: absolute; background: var(--W); border: 3px solid var(--K);
      box-shadow: var(--sh-sm); padding: 8px 14px;
      font-size: 12px; font-weight: 800; font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
    }
    .bf1 { top: -16px; right: -10px; background: var(--G); border-color: var(--K); }
    .bf2 { bottom: 30px; right: -20px; background: var(--B); color: var(--W); }
    .bf3 { bottom: -16px; left: 20px; background: var(--Y); }

    /* Features */
    .feat-section { padding: 60px 40px; border-top: 4px solid var(--K); background: var(--O); }
    .feat-heading { margin-bottom: 36px; }
    .feat-title { font-size: 52px; letter-spacing: .05em; color: var(--K); margin: 0 0 12px; }
    .feat-stripe {
      display: flex; height: 10px; width: 240px; border: 3px solid var(--K); overflow: hidden;
    }
    .feat-stripe div { flex: 1; }
    .feat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .feat-card {
      background: var(--W); border: var(--bd); box-shadow: var(--sh);
      padding: 24px; transition: transform .12s, box-shadow .12s;
    }
    .feat-card:hover { transform: translate(-3px,-3px); box-shadow: var(--sh-lg); }
    .feat-card:nth-child(4n+1) { border-left: 6px solid var(--R); }
    .feat-card:nth-child(4n+2) { border-left: 6px solid var(--B); }
    .feat-card:nth-child(4n+3) { border-left: 6px solid var(--G); }
    .feat-card:nth-child(4n+4) { border-left: 6px solid var(--Y); }
    .feat-icon { font-size: 32px; margin-bottom: 12px; }
    .feat-name { font-size: 22px; letter-spacing: .04em; margin: 0 0 8px; }
    .feat-desc { font-size: 14px; line-height: 1.65; color: #555; margin: 0; font-weight: 500; }

    /* How it works */
    .how-section { padding: 60px 40px; border-top: 4px solid var(--K); background: var(--K); }
    .how-title { font-size: 52px; letter-spacing: .05em; color: var(--Y); margin: 0 0 40px; }
    .how-steps { display: flex; align-items: flex-start; flex-wrap: wrap; }
    .how-step { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 200px; padding: 0 20px; }
    .how-step + .how-step { border-left: 2px solid #333; }
    .how-num {
      width: 48px; height: 48px; border: 3px solid var(--W);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; flex-shrink: 0;
    }
    .hn-red    { background: var(--R); color: var(--W); border-color: var(--R); }
    .hn-blue   { background: var(--B); color: var(--W); border-color: var(--B); }
    .hn-green  { background: var(--G); color: var(--K); border-color: var(--G); }
    .hn-yellow { background: var(--Y); color: var(--K); border-color: var(--Y); }
    .how-content { flex: 1; }
    .how-name { color: var(--W); font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
    .how-text { color: rgba(255,255,240,.45); font-size: 12px; line-height: 1.5; }
    .how-arrow { color: var(--Y); font-size: 28px; font-weight: 800; align-self: center; padding: 0 8px; }

    /* Lang bar */
    .lang-bar {
      background: var(--Y); border-top: 4px solid var(--K); border-bottom: 4px solid var(--K);
      height: 44px; display: flex; align-items: center; overflow: hidden;
    }
    .lang-inner { display: inline-flex; animation: marquee 16s linear infinite reverse; }
    .lang-item {
      padding: 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 12px;
      font-weight: 700; color: var(--K); letter-spacing: .08em; text-transform: uppercase;
      border-right: 3px solid var(--K); white-space: nowrap;
    }

    /* CTA Banner */
    .cta-banner {
      padding: 56px 40px; background: var(--R); border-top: 4px solid var(--K);
      display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap;
    }
    .banner-title { font-size: 56px; letter-spacing: .05em; color: var(--W); margin: 0 0 8px; }
    .banner-sub { color: rgba(255,255,240,.75); font-size: 13px; margin: 0; }
    .banner-btns { display: flex; gap: 14px; flex-wrap: wrap; }
    .banner-cta { font-size: 15px; padding: 16px 28px; }

    /* Footer */
    .footer {
      background: var(--K); border-top: 4px solid var(--Y);
      padding: 28px 40px; display: flex; align-items: center;
      justify-content: space-between; flex-wrap: wrap; gap: 16px;
    }
    .footer-brand { display: flex; align-items: center; gap: 10px; }
    .footer-bolt {
      width: 32px; height: 32px; background: var(--Y); border: 2px solid var(--W);
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    .footer-name { font-size: 20px; letter-spacing: .08em; color: var(--W); }
    .footer-links { display: flex; gap: 20px; }
    .fl { color: rgba(255,255,240,.55); font-size: 13px; text-decoration: none; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; transition: color .15s; }
    .fl:hover { color: var(--Y); }
    .footer-copy { color: rgba(255,255,240,.3); font-size: 12px; }

    /* Responsive */
    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; padding: 40px 20px; }
      .hero-right { display: none; }
      .ht-line { font-size: 64px; }
      .feat-section, .how-section, .cta-banner { padding: 40px 20px; }
      .how-steps { flex-direction: column; gap: 24px; }
      .how-step { border-left: none !important; border-top: 2px solid #333; padding: 20px 0 0; }
      .how-arrow { display: none; }
      .footer { flex-direction: column; text-align: center; }
    }
  `]
})
export class HomeComponent implements AfterViewInit {
  /* ── ViewChild refs — ALL renamed with "Ref" suffix to avoid collisions ── */
  @ViewChild('homeRef')      homeRef!: ElementRef;
  @ViewChild('eyebrowRef')   eyebrowRef!: ElementRef;
  @ViewChild('tl1')          tl1!: ElementRef;
  @ViewChild('tl2')          tl2!: ElementRef;
  @ViewChild('tl3')          tl3!: ElementRef;
  @ViewChild('hbodyRef')     hbodyRef!: ElementRef;
  @ViewChild('ctaRef')       ctaRef!: ElementRef;
  @ViewChild('trustRef')     trustRef!: ElementRef;
  @ViewChild('heroRightRef') heroRightRef!: ElementRef;
  @ViewChild('featGridRef')  featGridRef!: ElementRef;
  @ViewChild('bf1Ref')       bf1Ref!: ElementRef;
  @ViewChild('bf2Ref')       bf2Ref!: ElementRef;
  @ViewChild('bf3Ref')       bf3Ref!: ElementRef;

  private router = inject(Router);

  ticks = ['CODESYNC','COLLABORATE','REAL-TIME EDITOR','INSTANT EXECUTION','VERSION HISTORY','COMMENT ANYWHERE','TEAM COLLAB','OPEN SOURCE'];
  langTicks = ['Python','Java','TypeScript','JavaScript','Go','Rust','C++','Kotlin','Swift','Ruby','PHP','C#'];

  codeLines = [
    `<span class="kw">def</span> <span class="fn">fibonacci</span>(n):`,
    `    <span class="kw">if</span> n &lt;= 1: <span class="kw">return</span> n`,
    `    <span class="kw">return</span> fibonacci(n-<span class="str">1</span>) + fibonacci(n-<span class="str">2</span>)`,
    ``,
    `<span class="cm"># Run it live ↓</span>`,
    `<span class="fn">print</span>(fibonacci(<span class="str">10</span>))`,
  ];

  /* renamed from "features" to avoid @ViewChild collision */
  featuresList = [
    { icon:'✏️', name:'Real-Time Editor',     desc:'Monaco-powered editor with live collaborative cursors. See exactly where your teammates are.' },
    { icon:'▶️', name:'Instant Execution',    desc:'Run code in 10+ languages in sandboxed containers. Get output in seconds, not minutes.' },
    { icon:'📸', name:'Version Snapshots',    desc:'Save and restore any point in your code history. Branch, tag, and diff between versions.' },
    { icon:'💬', name:'Inline Comments',      desc:'Leave comments on any line of code. Resolve threads, reply, and keep context together.' },
    { icon:'🔔', name:'Smart Notifications',  desc:'Get notified when teammates join, comment, or finish a run. Never miss a thing.' },
    { icon:'🔐', name:'Secure & Private',     desc:'JWT-secured sessions, private projects, role-based access, and per-session passwords.' },
    { icon:'🍴', name:'Fork & Star',          desc:'Fork any public project in one click. Star your favourites and build on the community.' },
    { icon:'👑', name:'Team Management',      desc:'Add members, manage roles, archive old projects, and keep your workspace clean.' },
  ];

  /* renamed from "steps" to avoid potential collision */
  stepsList = [
    { name:'Sign Up Free',   text:'Create your account in 60 seconds. No credit card.',       color:'red'    },
    { name:'Create Project', text:'Name it, pick a language, set visibility.',                color:'blue'   },
    { name:'Invite Team',    text:'Share a link or add members by username.',                 color:'green'  },
    { name:'Code Together',  text:'Open the editor and start collaborating in real time.',    color:'yellow' },
  ];

  ngAfterViewInit(): void {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(this.eyebrowRef.nativeElement,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.4 }, '-=0.1')
      .fromTo([this.tl1.nativeElement, this.tl2.nativeElement, this.tl3.nativeElement],
        { x: -80, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.2')
      .fromTo([this.hbodyRef.nativeElement, this.ctaRef.nativeElement, this.trustRef.nativeElement],
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 }, '-=0.1');

    if (this.heroRightRef) {
      tl.fromTo(this.heroRightRef.nativeElement,
        { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, '-=0.5');
    }

    if (this.bf1Ref && this.bf2Ref && this.bf3Ref) {
      tl.fromTo(
        [this.bf1Ref.nativeElement, this.bf2Ref.nativeElement, this.bf3Ref.nativeElement],
        { scale: 0, rotation: -8 },
        { scale: 1, rotation: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.7)' }, '-=0.3'
      );
      gsap.to(this.bf1Ref.nativeElement, { y: -8, duration: 2,   repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to(this.bf2Ref.nativeElement, { y: -6, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 });
      gsap.to(this.bf3Ref.nativeElement, { y: -7, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });
    }

    if (this.featGridRef) {
      gsap.fromTo(this.featGridRef.nativeElement.querySelectorAll('.feat-card'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out', delay: 0.8 });
    }
  }
}
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { ExecutionService } from '../../services/other-services';
import { Project, User } from '../../core/models';

const LANG_COLORS: Record<string,string> = {
  TypeScript:'var(--B)',Go:'var(--G)',Python:'var(--G)',Rust:'var(--Y)',
  CSS:'var(--R)',C:'var(--K)',JavaScript:'var(--Y)',Java:'var(--R)',
  Swift:'var(--R)',Kotlin:'var(--B)',Ruby:'var(--R)',PHP:'var(--B)'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Hero Header -->
      <header class="dash-hdr" #header>
        <div class="hdr-left">
          <div class="hdr-greeting">Welcome back</div>
          <h1 class="bb">Hey, <span class="name">{{ user?.username }}</span> <span class="wave">👋</span></h1>
          <div class="date-pill">📅 {{ today | date:'EEEE, MMMM d, yyyy' }}</div>
        </div>
        <div class="hdr-actions">
          <button class="btn btn-outline" routerLink="/profile">👤 Profile</button>
          <button class="btn btn-B" routerLink="/projects/new">+ New Project</button>
        </div>
      </header>

      <!-- Stats -->
      <div class="stats-grid" #statsGrid>
        <div class="sc sc-R">
          <div class="sc-lbl">Projects</div>
          <div class="sc-val bb" #sv1>0</div>
          <div class="sc-ico">📁</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:70%"></div></div>
        </div>
        <div class="sc sc-B">
          <div class="sc-lbl">Total Stars</div>
          <div class="sc-val bb" #sv2>0</div>
          <div class="sc-ico">⭐</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:45%"></div></div>
        </div>
        <div class="sc sc-G">
          <div class="sc-lbl">Forks</div>
          <div class="sc-val bb" #sv3>0</div>
          <div class="sc-ico">🍴</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:30%"></div></div>
        </div>
        <div class="sc sc-Y">
          <div class="sc-lbl">Executions</div>
          <div class="sc-val bb" #sv4>0</div>
          <div class="sc-ico">🚀</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:85%"></div></div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions" #quickAct>
        <div class="qa-card" routerLink="/projects/new">
          <span class="qa-icon">🚀</span>
          <span class="qa-label">New Project</span>
        </div>
        <div class="qa-card" routerLink="/projects">
          <span class="qa-icon">📂</span>
          <span class="qa-label">Browse Projects</span>
        </div>
        <div class="qa-card" routerLink="/notifications">
          <span class="qa-icon">🔔</span>
          <span class="qa-label">Notifications</span>
        </div>
        <div class="qa-card" routerLink="/profile">
          <span class="qa-icon">👤</span>
          <span class="qa-label">My Profile</span>
        </div>
      </div>

      <!-- My Projects -->
      <div class="sec-row">
        <h2 class="bb">My Projects</h2>
        <div class="sec-bar"></div>
        <a routerLink="/projects" class="see-all">See all →</a>
      </div>
      <div class="proj-grid" #myGrid>
        <div class="proj-card" *ngFor="let p of myProjects" (click)="openProject(p.projectId)">
          <div class="pc-top-bar" [style.background]="getLangColor(p.language)"></div>
          <div class="pc-body">
            <div class="pc-badges">
              <span class="badge badge-B">{{ p.language }}</span>
              <span class="badge" [class]="p.visibility==='PUBLIC' ? 'badge-G' : 'badge-Y'">{{ p.visibility }}</span>
            </div>
            <div class="pc-name">{{ p.name }}</div>
            <div class="pc-desc">{{ p.description || 'No description' }}</div>
            <div class="pc-foot">
              <span>⭐ {{ p.starCount }}</span>
              <span>🍴 {{ p.forkCount }}</span>
              <span class="pc-date">{{ p.updatedAt | date:'MMM d' }}</span>
            </div>
          </div>
        </div>
        <div class="new-card" routerLink="/projects/new">
          <div class="plus">+</div>
          <p>New Project</p>
        </div>
      </div>

      <!-- Explore Public -->
      <ng-container *ngIf="publicProjects.length">
        <div class="sec-row">
          <h2 class="bb">Explore Public</h2>
          <div class="sec-bar"></div>
        </div>
        <div class="proj-grid" #pubGrid>
          <div class="proj-card" *ngFor="let p of publicProjects" (click)="openProject(p.projectId)">
            <div class="pc-top-bar" [style.background]="getLangColor(p.language)"></div>
            <div class="pc-body">
              <div class="pc-badges">
                <span class="badge badge-B">{{ p.language }}</span>
                <span class="badge badge-G">PUBLIC</span>
              </div>
              <div class="pc-name">{{ p.name }}</div>
              <div class="pc-desc">{{ p.description || 'No description' }}</div>
              <div class="pc-foot">
                <span>⭐ {{ p.starCount }}</span>
                <span>🍴 {{ p.forkCount }}</span>
                <button class="fork-btn" (click)="fork(p.projectId, $event)">⑂ Fork</button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard { padding:36px;max-width:1280px;margin:0 auto; }

    /* Header */
    .dash-hdr { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:40px;padding-bottom:28px;border-bottom:4px solid var(--K);gap:20px;flex-wrap:wrap; }
    .hdr-left { display:flex;flex-direction:column;gap:8px; }
    .hdr-greeting { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--B);opacity:.8; }
    h1 { font-size:52px;letter-spacing:.04em;line-height:1;margin:0; }
    .name { color:var(--B); }
    .wave { display:inline-block;animation:wave 2.5s ease-in-out infinite;transform-origin:70% 70%; }
    @keyframes wave { 0%,100%{transform:rotate(0deg)} 10%{transform:rotate(14deg)} 20%{transform:rotate(-8deg)} 30%{transform:rotate(14deg)} 40%{transform:rotate(-4deg)} 50%{transform:rotate(10deg)} 60%{transform:rotate(0deg)} }
    .date-pill { display:inline-flex;align-items:center;background:var(--Y);border:2px solid var(--K);padding:5px 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;box-shadow:3px 3px 0 var(--K); }
    .hdr-actions { display:flex;gap:10px;align-items:center;flex-wrap:wrap; }
    .btn { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;letter-spacing:.04em;text-transform:uppercase;border:3px solid var(--K);cursor:pointer;text-decoration:none;box-shadow:5px 5px 0 var(--K);background:var(--W);color:var(--K);transition:transform .08s,box-shadow .08s; }
    .btn:hover { transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--K); }
    .btn-B { background:var(--B);color:var(--W); }
    .btn-outline { background:transparent;color:var(--K);border:3px solid var(--K); }

    /* Stats */
    .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px; }
    .sc { border:3px solid var(--K);padding:22px;position:relative;overflow:hidden;box-shadow:5px 5px 0 var(--K);transition:transform .15s,box-shadow .15s;cursor:default; }
    .sc:hover { transform:translate(-3px,-3px);box-shadow:8px 8px 0 var(--K); }
    .sc-lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;opacity:.7; }
    .sc-val { font-size:54px;letter-spacing:.03em;line-height:1; }
    .sc-ico { position:absolute;bottom:28px;right:14px;font-size:38px;opacity:.15; }
    .sc-bar { position:absolute;bottom:0;left:0;width:100%;height:4px;background:rgba(0,0,0,.15); }
    .sc-bar-fill { height:100%;background:rgba(255,255,255,.4);transition:width 1s ease; }
    .sc-R { background:var(--R);color:var(--W); }
    .sc-B { background:var(--B);color:var(--W); }
    .sc-G { background:var(--G);color:var(--K); }
    .sc-Y { background:var(--Y);color:var(--K); }

    /* Quick Actions */
    .quick-actions { display:flex;gap:12px;margin-bottom:40px;flex-wrap:wrap; }
    .qa-card { display:flex;align-items:center;gap:10px;padding:12px 20px;border:3px solid var(--K);background:var(--W);cursor:pointer;box-shadow:4px 4px 0 var(--K);transition:transform .1s,box-shadow .1s,background .1s;text-decoration:none;color:var(--K); }
    .qa-card:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--K);background:var(--Y); }
    .qa-icon { font-size:20px; }
    .qa-label { font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em; }

    /* Section rows */
    .sec-row { display:flex;align-items:center;gap:14px;margin-bottom:18px; }
    .sec-row h2 { font-size:28px;letter-spacing:.06em;white-space:nowrap;margin:0; }
    .sec-bar { flex:1;height:3px;background:var(--K); }
    .see-all { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--B);text-decoration:underline;cursor:pointer;white-space:nowrap; }

    /* Project grid */
    .proj-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px;margin-bottom:48px; }
    .proj-card { border:3px solid var(--K);background:var(--W);cursor:pointer;box-shadow:5px 5px 0 var(--K);transition:transform .1s,box-shadow .1s;display:flex;flex-direction:column;overflow:hidden; }
    .proj-card:hover { transform:translate(-3px,-3px);box-shadow:8px 8px 0 var(--K); }
    .pc-top-bar { height:7px;width:100%;flex-shrink:0; }
    .pc-body { padding:18px;display:flex;flex-direction:column;flex:1; }
    .pc-badges { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px; }
    .badge { display:inline-flex;align-items:center;padding:3px 9px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border:2px solid var(--K); }
    .badge-B { background:var(--B);color:var(--W); }
    .badge-G { background:var(--G);color:var(--K); }
    .badge-Y { background:var(--Y);color:var(--K); }
    .pc-name { font-weight:800;font-size:15px;margin-bottom:6px; }
    .pc-desc { font-size:13px;color:#666;line-height:1.5;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1; }
    .pc-foot { display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;color:#666;border-top:2px solid var(--K);padding-top:12px; }
    .pc-date { margin-left:auto;font-size:11px;opacity:.5; }
    .fork-btn { margin-left:auto;background:var(--K);color:var(--W);border:2px solid var(--K);padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:.04em;transition:background .1s; }
    .fork-btn:hover { background:var(--B);border-color:var(--B); }
    .new-card { border:3px dashed var(--K);background:var(--O);display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:160px;cursor:pointer;box-shadow:5px 5px 0 var(--K);transition:background .1s,transform .1s,box-shadow .1s; }
    .new-card:hover { background:var(--Y);transform:translate(-3px,-3px);box-shadow:8px 8px 0 var(--K); }
    .plus { font-family:'Bebas Neue',sans-serif;font-size:58px;opacity:.3;line-height:1; }
    .new-card p { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin-top:4px; }

    @media(max-width:900px) { .stats-grid{grid-template-columns:repeat(2,1fr);} .dashboard{padding:20px 16px;} h1{font-size:36px;} }
    @media(max-width:480px) { .stats-grid{grid-template-columns:repeat(2,1fr);} .hdr-actions{width:100%;} .btn{flex:1;justify-content:center;} }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('header') headerRef!: ElementRef;
  @ViewChild('statsGrid') statsRef!: ElementRef;
  @ViewChild('myGrid') myGridRef!: ElementRef;
  @ViewChild('pubGrid') pubGridRef!: ElementRef;
  @ViewChild('quickAct') quickActRef!: ElementRef;
  @ViewChild('sv1') sv1!: ElementRef;
  @ViewChild('sv2') sv2!: ElementRef;
  @ViewChild('sv3') sv3!: ElementRef;
  @ViewChild('sv4') sv4!: ElementRef;

  private projectSvc = inject(ProjectService);
  private authSvc = inject(AuthService);
  private execSvc = inject(ExecutionService);
  private router = inject(Router);

  user: User | null = null;
  myProjects: Project[] = [];
  publicProjects: Project[] = [];
  today = new Date();

  ngOnInit(): void {
    this.user = this.authSvc.getCurrentUser();
    if (this.user) {
      this.projectSvc.getByOwner(this.user.userId).subscribe(projects => {
        this.myProjects = projects.slice(0, 6);
        setTimeout(() => {
          this.countUp(this.sv1, projects.length);
          this.countUp(this.sv2, projects.reduce((s,p)=>s+p.starCount,0));
          this.countUp(this.sv3, projects.reduce((s,p)=>s+p.forkCount,0));
        });
      });
      this.execSvc.getStats().subscribe((s: any) => setTimeout(()=>this.countUp(this.sv4, s.totalJobs||0)));
    }
    this.projectSvc.getPublic().subscribe(p => this.publicProjects = p.slice(0, 6));
  }

  ngAfterViewInit(): void {
    if (!this.headerRef?.nativeElement) return;
    const tl = gsap.timeline();
    tl.fromTo(this.headerRef.nativeElement,
        { opacity:0, y:-24 }, { opacity:1, y:0, duration:.5, ease:'power3.out' })
      .fromTo(this.statsRef.nativeElement.querySelectorAll('.sc'),
        { y:40, opacity:0, rotation:3 }, { y:0, opacity:1, rotation:0, duration:.5, stagger:.1, ease:'back.out(1.2)' }, '-=.1')
      .fromTo(this.quickActRef?.nativeElement?.querySelectorAll('.qa-card') || [],
        { y:20, opacity:0 }, { y:0, opacity:1, duration:.3, stagger:.06, ease:'power2.out' }, '-=.1')
      .fromTo('.sec-row',
        { x:-20, opacity:0 }, { x:0, opacity:1, duration:.4, stagger:.1, ease:'power2.out' }, '-=.1')
      .fromTo('.proj-card, .new-card',
        { y:28, opacity:0 }, { y:0, opacity:1, duration:.4, stagger:.06, ease:'power2.out' }, '-=.1');
  }

  private countUp(ref: ElementRef, target: number): void {
    if (!ref?.nativeElement) return;
    const obj = { n: 0 };
    gsap.to(obj, { n: target, duration: 1.3, ease: 'power2.out',
      onUpdate: () => { if (ref?.nativeElement) ref.nativeElement.textContent = String(Math.round(obj.n)); }
    });
  }

  openProject(id: number): void { this.router.navigate(['/projects', id]); }

  fork(id: number, e: Event): void {
    e.stopPropagation();
    this.projectSvc.fork(id).subscribe(()=>{
      const user = this.authSvc.getCurrentUser();
      if (user) this.projectSvc.getByOwner(user.userId).subscribe(p=>this.myProjects=p.slice(0,6));
    });
  }

  getLangColor(lang: string): string { return LANG_COLORS[lang] || 'var(--K)'; }
}

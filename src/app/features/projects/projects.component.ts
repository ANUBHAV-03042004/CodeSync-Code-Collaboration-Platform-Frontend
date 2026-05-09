import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { gsap } from 'gsap';
import { ProjectService } from '../../services/project.service';
import { FileService } from '../../services/file.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Project, CodeFile } from '../../core/models';

// ── Project List ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="nb-page" #page>
      <!-- Brand Ticker -->
      <div class="nb-ticker">
        <div class="ticker-wrap">
          <span *ngFor="let i of [1,2,3,4,5,6]">NEO-BRUTALIST CODE SYNC // BUILD FAST // BREAK NOTHING // </span>
        </div>
      </div>

      <div class="page-hdr">
        <h1 class="main-title">PROJECTS</h1>
        <div class="hdr-right">
          <div class="search-box">
            <span class="s-ic">🔍</span>
            <input [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="SEARCH PROJECTS..." class="s-inp" />
          </div>
          <button routerLink="/projects/new" class="nb-btn btn-yellow">+ NEW PROJECT</button>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab" [class.active]="tab==='mine'" (click)="setTab('mine')">MY STUFF ({{myProjects.length}})</button>
        <button class="tab" [class.active]="tab==='member'" (click)="setTab('member')">SHARED ({{memberProjects.length}})</button>
        <button class="tab" [class.active]="tab==='public'" (click)="setTab('public')">EXPLORE ({{publicProjects.length}})</button>
      </div>

      <div class="projects-grid" #grid>
        <div class="pc-card" *ngFor="let p of displayed" (click)="open(p.projectId)">
          <div class="pc-accent" [style.background]="getLangColor(p.language)"></div>
          <div class="pc-content">
            <div class="pc-top">
              <span class="nb-badge small" [style.background]="getLangColor(p.language)">{{p.language}}</span>
              <span class="nb-badge small" [class.blue]="p.visibility==='PRIVATE'" [class.green]="p.visibility==='PUBLIC'">{{p.visibility}}</span>
            </div>
            <h3 class="pc-title">{{p.name}}</h3>
            <p class="pc-desc">{{p.description||'No description provided.'}}</p>
            <div class="pc-foot">
              <div class="stats">
                <span>★ {{p.starCount}}</span>
                <span>🍴 {{p.forkCount}}</span>
              </div>
              <div class="actions">
                <button class="nb-btn-sm" [class.active]="isStarred(p)" (click)="star(p, $event)">
                  {{ isStarred(p) ? '★' : '☆' }}
                </button>
                <button class="nb-btn-sm" [class.active]="isForked(p)" (click)="fork(p, $event)">
                  🍴
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!displayed.length">
        <div class="empty-icon">📭</div>
        <p>NOTHING FOUND HERE.</p>
        <button class="nb-btn btn-white" (click)="searchQuery='';onSearch()" *ngIf="searchQuery">CLEAR SEARCH</button>
      </div>
    </div>
  `,
  styles: [`
    .nb-page { padding: 48px 24px; max-width: 1200px; margin: 0 auto; }
    
    .nb-ticker { background: var(--K); color: var(--Y); overflow: hidden; white-space: nowrap; padding: 12px 0; border: 4px solid var(--K); transform: rotate(-1deg) scale(1.05); margin-bottom: 60px; box-shadow: 8px 8px 0 var(--K); }
    .ticker-wrap { display: inline-block; animation: ticker 20s linear infinite; font-weight: 900; font-size: 14px; letter-spacing: 2px; }
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

    .page-hdr { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
    .main-title { font-family: 'Bebas Neue', sans-serif; font-size: 84px; line-height: 0.8; margin: 0; color: var(--K); letter-spacing: 2px; }
    
    .hdr-right { display: flex; gap: 20px; align-items: center; }
    .search-box { border: 4px solid var(--K); background: var(--W); display: flex; align-items: center; padding: 0 16px; box-shadow: 6px 6px 0 var(--K); }
    .s-inp { border: none; outline: none; padding: 14px 0; font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 14px; width: 240px; text-transform: uppercase; }
    .s-ic { margin-right: 12px; font-size: 18px; }

    .tab-bar { display: flex; gap: 8px; margin-bottom: 32px; border-bottom: 4px solid var(--K); }
    .tab { border: 4px solid var(--K); border-bottom: none; padding: 12px 24px; font-weight: 800; cursor: pointer; background: var(--O); transform: translateY(4px); transition: all .1s; }
    .tab.active { background: var(--Y); transform: translateY(0); box-shadow: 4px -4px 0 var(--K); }

    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 32px; }
    .pc-card { border: 4px solid var(--K); background: var(--W); box-shadow: 8px 8px 0 var(--K); cursor: pointer; transition: all .15s; display: flex; flex-direction: column; overflow: hidden; }
    .pc-card:hover { transform: translate(-4px, -4px); box-shadow: 12px 12px 0 var(--K); }
    .pc-accent { height: 12px; border-bottom: 4px solid var(--K); }
    .pc-content { padding: 24px; flex: 1; display: flex; flex-direction: column; }
    .pc-top { display: flex; gap: 10px; margin-bottom: 16px; }
    .pc-title { font-size: 24px; font-weight: 800; margin: 0 0 12px; text-transform: uppercase; color: var(--K); }
    .pc-desc { font-size: 16px; color: #555; line-height: 1.4; margin-bottom: 24px; flex: 1; }
    
    .pc-foot { display: flex; justify-content: space-between; align-items: center; border-top: 4px solid var(--K); padding-top: 16px; margin-top: auto; }
    .stats { display: flex; gap: 16px; font-weight: 800; font-size: 14px; }
    .actions { display: flex; gap: 8px; }

    .nb-badge { padding: 4px 12px; border: 3px solid var(--K); font-size: 10px; font-weight: 800; text-transform: uppercase; background: var(--W); box-shadow: 3px 3px 0 var(--K); }
    .nb-badge.blue { background: var(--B); color: #fff; }
    .nb-badge.green { background: var(--G); color: #fff; }
    .small { font-size: 9px; padding: 2px 8px; }

    .nb-btn { border: 4px solid var(--K); padding: 14px 24px; font-weight: 800; cursor: pointer; box-shadow: 6px 6px 0 var(--K); transition: all .1s; text-transform: uppercase; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .nb-btn:active { transform: translate(2px, 2px); box-shadow: 4px 4px 0 var(--K); }
    .btn-yellow { background: var(--Y); }
    .btn-white { background: var(--W); }

    .nb-btn-sm { border: 3px solid var(--K); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--W); cursor: pointer; box-shadow: 3px 3px 0 var(--K); font-weight: 800; }
    .nb-btn-sm.active { background: var(--K); color: var(--W); }

    .empty-state { text-align: center; padding: 100px 0; border: 4px dashed var(--K); grid-column: 1/-1; }
    .empty-icon { font-size: 64px; margin-bottom: 20px; }
    
    @media (max-width: 768px) {
      .main-title { font-size: 56px; }
      .projects-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProjectListComponent implements OnInit, AfterViewInit {
  @ViewChild('page') pageRef!: ElementRef;
  @ViewChild('grid') gridRef!: ElementRef;

  private projectSvc = inject(ProjectService);
  private authSvc = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  tab: 'mine' | 'member' | 'public' = 'mine';
  searchQuery = '';
  myProjects: Project[] = [];
  memberProjects: Project[] = [];
  publicProjects: Project[] = [];
  displayed: Project[] = [];

  ngOnInit(): void {
    const user = this.authSvc.getCurrentUser();
    if (user) {
      this.projectSvc.getByOwner(user.userId).subscribe(p => { this.myProjects = p; this.updateDisplayed(); });
      this.projectSvc.getByMember(user.userId).subscribe(p => this.memberProjects = p);
    }
    this.projectSvc.getPublic().subscribe(p => this.publicProjects = p);
  }

  ngAfterViewInit(): void {
    gsap.fromTo(this.pageRef.nativeElement,
      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
  }

  setTab(t: typeof this.tab): void { this.tab = t; this.updateDisplayed(); }

  updateDisplayed(): void {
    const src = this.tab === 'mine' ? this.myProjects
      : this.tab === 'member' ? this.memberProjects
      : this.publicProjects;
    this.displayed = this.searchQuery
      ? src.filter(p => p.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
      : src;
    setTimeout(() => {
      if (this.gridRef) {
        gsap.fromTo(this.gridRef.nativeElement.querySelectorAll('.project-card'),
          { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
      }
    });
  }

  onSearch(): void { this.updateDisplayed(); }

  open(id: number): void { this.router.navigate(['/projects', id]); }

  isStarred(p: Project): boolean {
    const user = this.authSvc.getCurrentUser();
    return !!(p.starredBy && user && p.starredBy.includes(user.userId));
  }

  isForked(p: Project): boolean {
    const user = this.authSvc.getCurrentUser();
    return !!(p.forkedBy && user && p.forkedBy.includes(user.userId));
  }

  star(p: Project, e: Event): void {
    e.stopPropagation();
    const wasStarred = this.isStarred(p);
    this.projectSvc.star(p.projectId).subscribe(() => {
      this.toast.success(wasStarred ? 'Removed from Stars!' : 'Project Starred!');
      const user = this.authSvc.getCurrentUser();
      if (user) this.projectSvc.getByOwner(user.userId).subscribe(projs => { this.myProjects = projs; this.updateDisplayed(); });
      this.projectSvc.getPublic().subscribe(projs => this.publicProjects = projs);
    });
  }

  fork(p: Project, e: Event): void {
    e.stopPropagation();
    const wasForked = this.isForked(p);
    this.projectSvc.fork(p.projectId).subscribe(() => {
      this.toast.success(wasForked ? 'Fork Deleted!' : 'Project Forked Successfully!');
      const user = this.authSvc.getCurrentUser();
      if (user) this.projectSvc.getByOwner(user.userId).subscribe(projs => { this.myProjects = projs; this.updateDisplayed(); });
      this.projectSvc.getPublic().subscribe(projs => this.publicProjects = projs);
    });
  }

  private LANG_COLORS: Record<string,string> = {
    TypeScript:'#1E88E5',Go:'#43A047',Python:'#43A047',Rust:'#FB8C00',
    CSS:'#E53935',C:'#0A0A0A',JavaScript:'#FDD835',Java:'#E53935',
    Swift:'#E53935',Kotlin:'#1E88E5',Ruby:'#E53935',PHP:'#1E88E5'
  };
  getLangColor(lang: string): string { return this.LANG_COLORS[lang] || '#0A0A0A'; }

}

// ── Project Create ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-card" #card>
        <div class="card-banner">
          <div class="banner-pre">&#128640; CodeSync</div>
          <h1>New Project</h1>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="nb-form">
          <div class="nb-field">
            <label>Project Name *</label>
            <input type="text" formControlName="name" placeholder="my-awesome-project" />
            <span class="ferr" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">Name is required</span>
          </div>
          <div class="nb-field">
            <label>Description</label>
            <textarea formControlName="description" placeholder="What is this project about?" rows="3"></textarea>
          </div>
          <div class="nb-field">
            <label>Language *</label>
            <select formControlName="language">
              <option value="" disabled>Select language...</option>
              <option *ngFor="let lang of languages" [value]="lang">{{ lang }}</option>
            </select>
            <span class="ferr" *ngIf="form.get('language')?.invalid && form.get('language')?.touched">Select a language</span>
          </div>
          <div class="nb-field">
            <label>Visibility</label>
            <div class="vis-group">
              <label class="vis-opt" [class.sel-pub]="form.get('visibility')?.value==='PUBLIC'">
                <input type="radio" formControlName="visibility" value="PUBLIC" />
                &#127760; Public &mdash; Anyone can view
              </label>
              <label class="vis-opt" [class.sel-priv]="form.get('visibility')?.value==='PRIVATE'">
                <input type="radio" formControlName="visibility" value="PRIVATE" />
                &#128274; Private &mdash; Only members
              </label>
            </div>
          </div>
          <div class="form-actions">
            <a routerLink="/projects" class="nb-btn ob">&#8592; Cancel</a>
            <button type="submit" [disabled]="loading" class="nb-btn yb">
              {{ loading ? 'Creating…' : 'Create Project &#8594;' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page{min-height:80vh;display:flex;align-items:flex-start;justify-content:center;padding:48px 24px}
    .page-card{border:4px solid #0A0A0A;background:#fff;box-shadow:8px 8px 0 #0A0A0A;width:100%;max-width:600px}
    .card-banner{background:#0A0A0A;padding:24px 32px;position:relative;overflow:hidden}
    .card-banner::after{content:'NEW PROJECT';position:absolute;right:20px;top:50%;transform:translateY(-50%);font-family:'Bebas Neue',sans-serif;font-size:64px;color:rgba(255,255,255,.05);letter-spacing:.1em;white-space:nowrap}
    .banner-pre{font-size:10px;font-weight:800;letter-spacing:2px;color:#FDD835;text-transform:uppercase;margin-bottom:6px}
    h1{font-family:'Bebas Neue',sans-serif;font-size:48px;color:#fff;letter-spacing:.05em;margin:0;line-height:1}
    .nb-form{padding:32px}
    .nb-field{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
    label{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#666}
    input[type=text],textarea,select{border:3px solid #0A0A0A;padding:11px 14px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;background:#fff;color:#0A0A0A;outline:none;box-shadow:3px 3px 0 #0A0A0A;transition:box-shadow .12s,border-color .12s;resize:vertical;width:100%;box-sizing:border-box}
    input[type=text]:focus,textarea:focus,select:focus{border-color:#1E88E5;box-shadow:4px 4px 0 #1E88E5}
    select option{background:#fff;color:#0A0A0A}
    .ferr{font-size:10px;color:#E53935;font-weight:800;text-transform:uppercase;letter-spacing:1px}
    .vis-group{display:flex;gap:12px;flex-wrap:wrap}
    .vis-opt{flex:1;min-width:160px;border:3px solid #0A0A0A;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;transition:background .12s,transform .08s,box-shadow .08s;box-shadow:3px 3px 0 #0A0A0A;background:#fff}
    .vis-opt:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 #0A0A0A}
    .vis-opt.sel-pub{background:#43A047;color:#fff}
    .vis-opt.sel-priv{background:#1E88E5;color:#fff}
    .vis-opt input{display:none}
    .form-actions{display:flex;gap:10px;justify-content:flex-end;padding-top:8px}
    .nb-btn{border:3px solid #0A0A0A;padding:12px 24px;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer;box-shadow:4px 4px 0 #0A0A0A;display:inline-flex;align-items:center;gap:6px;text-decoration:none;transition:transform .08s,box-shadow .08s}
    .nb-btn:hover:not(:disabled){transform:translate(-2px,-2px);box-shadow:6px 6px 0 #0A0A0A}
    .nb-btn:disabled{opacity:.5;cursor:not-allowed}
    .yb{background:#FDD835;color:#0A0A0A}
    .ob{background:#fff;color:#0A0A0A}
    @media(max-width:600px){.page{padding:20px 12px} .nb-form{padding:20px} h1{font-size:36px} .vis-group{flex-direction:column}}
  `]
})
export class ProjectCreateComponent implements AfterViewInit {
  @ViewChild('card') cardRef!: ElementRef;
  private fb = inject(FormBuilder);
  private projectSvc = inject(ProjectService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private toast = inject(ToastService);

  loading = false;
  languages = ['Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C', 'C++', 'Ruby', 'PHP', 'Kotlin', 'Swift'];

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    language: ['', Validators.required],
    visibility: ['PUBLIC', Validators.required]
  });

  ngAfterViewInit(): void {
    gsap.fromTo(this.cardRef.nativeElement,
      { opacity: 0, y: 40, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.projectSvc.create(this.form.value).subscribe({
      next: p => {
        this.toast.success('Project created!');
        this.ngZone.run(() => this.router.navigate(['/projects', p.projectId]));
      },
      error: () => { this.loading = false; this.toast.error('Failed to create project.'); }
    });
  }
}

// ── Project Detail ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page" *ngIf="project">
      <!-- High-Visibility Marker -->
      <div class="nb-dev-banner">NEO-BRUTALIST PROJECT DETAIL ACTIVE</div>
      <!-- Top Banner / Hero -->
      <div class="nb-hero" #hero>
        <div class="hero-content">
          <div class="breadcrumbs">
            <a routerLink="/projects">PROJECTS</a> / <span class="active">{{ project.name }}</span>
          </div>
          <h1 class="bb main-title">{{ project.name }}</h1>
          <p class="desc">{{ project.description || 'No description provided for this project.' }}</p>

          <div class="badges">
            <span class="nb-badge lang-badge" [style.background]="getLangColor(project.language)">{{ project.language }}</span>
            <span class="nb-badge vis-badge" [class.blue]="project.visibility === 'PRIVATE'" [class.green]="project.visibility === 'PUBLIC'">
              {{ project.visibility }}
            </span>
            <span class="nb-badge red-badge" *ngIf="project.archived">ARCHIVED</span>
          </div>
        </div>

        <div class="hero-actions">
          <button class="nb-btn btn-blue main-cta" [routerLink]="['/editor', project.projectId]">
            OPEN EDITOR <span class="arr">↗</span>
          </button>
          <div class="social-row">
            <button class="nb-btn btn-yellow flex-1" (click)="star()" [class.active]="isStarred">
              {{ isStarred ? '★ UNSTAR' : '☆ STAR' }}
            </button>
            <button class="nb-btn btn-white flex-1" (click)="fork()" [class.active]="isForked">
              {{ isForked ? '🍴 UNFORK' : '🍴 FORK' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" #stats>
        <div class="stat-card">
          <div class="val">{{ project.starCount }}</div>
          <div class="lbl">STARS</div>
        </div>
        <div class="stat-card">
          <div class="val">{{ project.forkCount }}</div>
          <div class="lbl">FORKS</div>
        </div>
        <div class="stat-card">
          <div class="val">{{ (project.memberIds || []).length }}</div>
          <div class="lbl">MEMBERS</div>
        </div>
        <div class="stat-card">
          <div class="val">{{ files.length }}</div>
          <div class="lbl">FILES</div>
        </div>
      </div>

      <!-- Content Row -->
      <div class="content-row">
        <div class="main-col" #mainCol>
          <div class="nb-card">
            <div class="nb-card-hdr yellow-hdr">
              <span class="card-label">PROJECT FILES</span>
              <div class="hdr-accent"></div>
            </div>
            <div class="file-list">
              <div class="file-row" *ngFor="let f of files">
                <span class="f-icon">{{ getIcon(f.language) }}</span>
                <div class="f-info">
                  <span class="f-name">{{ f.name }}</span>
                  <span class="f-path">{{ f.path }}</span>
                </div>
                <span class="f-lang">{{ f.language }}</span>
              </div>
              <div class="empty-files" *ngIf="!files.length">
                <div class="empty-icon">📭</div>
                <p>No files found. Launch the editor to start coding!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar / Info -->
        <div class="side-col" #sideCol>
          <div class="nb-card mb-24">
            <div class="nb-card-hdr blue-hdr">
              <span class="card-label">ABOUT</span>
            </div>
            <div class="card-body">
              <div class="info-item">
                <label>OWNER</label>
                <div class="owner-tag">USER #{{ project.ownerId }}</div>
              </div>
              <div class="info-item">
                <label>CREATED</label>
                <div>{{ project.createdAt | date:'MMMM d, y' }}</div>
              </div>
              <div class="info-item">
                <label>LATEST UPDATE</label>
                <div>{{ project.updatedAt | date:'medium' }}</div>
              </div>
            </div>
          </div>

          <div class="nb-card mb-24">
            <div class="nb-card-hdr green-hdr">
              <span class="card-label">COLLABORATORS</span>
            </div>
            <div class="collab-list">
              <div class="collab-item" *ngFor="let mid of project.memberIds">
                <div class="avatar-sm">U{{ mid }}</div>
                <span>User #{{ mid }}</span>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="nb-card danger-card" *ngIf="currentUser?.userId === project.ownerId">
            <div class="nb-card-hdr red-hdr">
              <span class="card-label">DANGER ZONE</span>
            </div>
            <div class="card-body">
              <p class="danger-text">Permanently delete this project and all its files.</p>
              <button class="nb-btn btn-red w-full" (click)="deleteProject()">
                DELETE PROJECT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-wrap" *ngIf="!project">
      <div class="nb-loader"></div>
      <p>FETCHING PROJECT DATA...</p>
    </div>
  `,
  styles: [`
    .nb-dev-banner { background: var(--Y); color: var(--K); font-weight: 900; text-align: center; padding: 12px; border: 4px solid var(--K); margin-bottom: 24px; font-size: 14px; letter-spacing: 2px; box-shadow: 6px 6px 0 var(--K); }
    .page { padding: 48px 24px; max-width: 1200px; margin: 0 auto; min-height: 100vh; }

    /* ── Hero ── */
    .nb-hero { display: flex; justify-content: space-between; gap: 48px; margin-bottom: 48px; flex-wrap: wrap; align-items: flex-start; }
    .hero-content { flex: 1; min-width: 320px; }
    .breadcrumbs { font-size: 11px; font-weight: 800; color: #888; margin-bottom: 12px; letter-spacing: 2px; }
    .breadcrumbs a { color: var(--B); text-decoration: none; border-bottom: 2px solid transparent; }
    .breadcrumbs a:hover { border-bottom-color: var(--B); }
    .breadcrumbs .active { color: var(--K); }

    h1.main-title { font-family: 'Bebas Neue', sans-serif; font-size: 72px; margin: 0 0 16px; line-height: 0.9; letter-spacing: 1px; color: var(--K); text-transform: uppercase; }
    .desc { font-size: 20px; color: #333; font-weight: 500; margin-bottom: 28px; max-width: 650px; line-height: 1.4; }

    .badges { display: flex; gap: 12px; }
    .nb-badge { padding: 6px 14px; border: 3px solid var(--K); font-size: 11px; font-weight: 800; text-transform: uppercase; background: var(--W); box-shadow: 4px 4px 0 var(--K); letter-spacing: 1px; }
    .nb-badge.blue { background: var(--B); color: #fff; }
    .nb-badge.green { background: var(--G); color: #fff; }
    .nb-badge.red-badge { background: var(--R); color: #fff; }

    .hero-actions { display: flex; flex-direction: column; gap: 20px; width: 360px; }
    .social-row { display: flex; gap: 16px; }
    .nb-btn { border: 4px solid var(--K); padding: 16px 24px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; cursor: pointer; font-size: 14px; box-shadow: 6px 6px 0 var(--K); transition: all .1s; text-transform: uppercase; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
    .nb-btn:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 var(--K); }
    .nb-btn:active { transform: translate(2px, 2px); box-shadow: 4px 4px 0 var(--K); }
    .nb-btn.active { background: var(--K) !important; color: #fff !important; }

    .btn-blue { background: var(--B); color: #fff; }
    .btn-yellow { background: var(--Y); color: var(--K); }
    .btn-white { background: var(--W); color: var(--K); }
    .btn-red { background: var(--R); color: #fff; }
    .main-cta { font-size: 20px; padding: 22px; }
    .flex-1 { flex: 1; }
    .w-full { width: 100%; }

    /* ── Stats ── */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 48px; }
    .stat-card { border: 4px solid var(--K); background: var(--W); padding: 24px; box-shadow: 8px 8px 0 var(--K); text-align: center; }
    .stat-card .val { font-size: 40px; font-weight: 800; line-height: 1; margin-bottom: 6px; font-family: 'Bebas Neue', sans-serif; }
    .stat-card .lbl { font-size: 11px; font-weight: 800; color: #666; letter-spacing: 2px; }

    /* ── Content ── */
    .content-row { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }
    .nb-card { border: 4px solid var(--K); background: var(--W); box-shadow: 8px 8px 0 var(--K); overflow: hidden; }
    .nb-card-hdr { padding: 14px 24px; border-bottom: 4px solid var(--K); display: flex; align-items: center; gap: 14px; }
    .yellow-hdr { background: var(--Y); }
    .blue-hdr { background: var(--B); color: #fff; }
    .green-hdr { background: var(--G); color: #fff; }
    .red-hdr { background: var(--R); color: #fff; }
    .card-label { font-size: 13px; font-weight: 800; letter-spacing: 2px; }
    .hdr-accent { flex: 1; height: 4px; background: rgba(0,0,0,0.1); }

    .file-list { display: flex; flex-direction: column; }
    .file-row { display: flex; align-items: center; padding: 18px 24px; border-bottom: 3px solid var(--O); transition: background .15s; }
    .file-row:last-child { border-bottom: none; }
    .file-row:hover { background: var(--O); }
    .f-icon { font-size: 28px; margin-right: 20px; }
    .f-info { flex: 1; display: flex; flex-direction: column; }
    .f-name { font-weight: 800; font-size: 16px; color: var(--K); }
    .f-path { font-size: 12px; color: #777; font-family: 'JetBrains Mono', monospace; }
    .f-lang { font-size: 11px; font-weight: 800; padding: 3px 10px; border: 3px solid var(--K); text-transform: uppercase; background: var(--W); box-shadow: 3px 3px 0 var(--K); }

    .card-body { padding: 24px; }
    .info-item { margin-bottom: 20px; }
    .info-item:last-child { margin-bottom: 0; }
    .info-item label { display: block; font-size: 10px; font-weight: 800; color: #888; letter-spacing: 1.5px; margin-bottom: 6px; text-transform: uppercase; }
    .info-item div { font-weight: 700; font-size: 15px; }
    .owner-tag { color: var(--B); font-weight: 800 !important; }

    .collab-list { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .collab-item { display: flex; align-items: center; gap: 14px; padding: 10px; border: 2px solid transparent; transition: all .1s; }
    .collab-item:hover { border-color: var(--K); background: var(--O); }
    .avatar-sm { width: 36px; height: 36px; border: 3px solid var(--K); background: var(--Y); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; box-shadow: 3px 3px 0 var(--K); }

    .danger-card { border-color: var(--R); }
    .danger-text { font-size: 13px; font-weight: 600; color: #666; margin-bottom: 16px; line-height: 1.5; }

    .mb-24 { margin-bottom: 24px; }

    @media (max-width: 960px) {
      .content-row { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .hero-actions { width: 100%; }
      h1.main-title { font-size: 56px; }
    }

    @media (max-width: 900px) {
      .content-row { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .hero-actions { width: 100%; }
    }
  `]
})
export class ProjectDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('hero') heroRef!: ElementRef;
  @ViewChild('stats') statsRef!: ElementRef;
  @ViewChild('mainCol') mainColRef!: ElementRef;
  @ViewChild('sideCol') sideColRef!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectSvc = inject(ProjectService);
  private fileSvc = inject(FileService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  project: Project | null = null;
  files: CodeFile[] = [];
  currentUser = this.authSvc.getCurrentUser();

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject(id);
    this.fileSvc.getTree(id).subscribe(f => this.files = f.filter(x => !x.deleted && x.fileType === 'FILE'));
  }

  loadProject(id: number): void {
    this.projectSvc.getById(id).subscribe(p => this.project = p);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.heroRef) {
        gsap.fromTo(this.heroRef.nativeElement,
          { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power4.out' });
      }
      if (this.statsRef) {
        gsap.fromTo(this.statsRef.nativeElement.querySelectorAll('.stat-card'),
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)', delay: 0.2 });
      }
      if (this.mainColRef) {
        gsap.fromTo(this.mainColRef.nativeElement,
          { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.4 });
      }
      if (this.sideColRef) {
        gsap.fromTo(this.sideColRef.nativeElement,
          { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.4 });
      }
    }, 100);
  }

  get isStarred(): boolean {
    return !!(this.project?.starredBy && this.currentUser && this.project.starredBy.includes(this.currentUser.userId));
  }

  get isForked(): boolean {
    return !!(this.project?.forkedBy && this.currentUser && this.project.forkedBy.includes(this.currentUser.userId));
  }

  star(): void {
    if (!this.project) return;
    const wasStarred = this.isStarred;
    this.projectSvc.star(this.project.projectId).subscribe(() => {
      this.toast.success(wasStarred ? 'Removed from Stars!' : 'Project Starred!');
      this.loadProject(this.project!.projectId);
    });
  }

  fork(): void {
    if (!this.project) return;
    const wasForked = this.isForked;
    this.projectSvc.fork(this.project.projectId).subscribe({
      next: (res) => {
        this.toast.success(wasForked ? 'Fork Deleted!' : 'Project Forked Successfully!');
        this.loadProject(this.project!.projectId);
      },
      error: () => this.toast.error('Operation failed')
    });
  }

  deleteProject(): void {
    if (!this.project) return;
    if (confirm(`ARE YOU SURE? This will permanently delete "${this.project.name}". This action cannot be undone.`)) {
      this.projectSvc.delete(this.project.projectId).subscribe({
        next: () => {
          this.toast.success('Project deleted successfully');
          this.router.navigate(['/projects']);
        },
        error: () => this.toast.error('Failed to delete project')
      });
    }
  }

  getIcon(lang: string): string {
    const m: Record<string, string> = {
      java: '☕', python: '🐍', javascript: '🟨', typescript: '🔷',
      go: '🐹', rust: '🦀', html: '🌐', css: '🎨', ruby: '💎', php: '🐘'
    };
    return m[lang?.toLowerCase()] || '📄';
  }

  getLangColor(lang: string): string {
    const m: Record<string, string> = {
      java: '#FFD600', python: '#00C853', javascript: '#FFD600',
      typescript: '#1A6FFF', cpp: '#FF2D2D', go: '#00C853', rust: '#FB8C00'
    };
    return m[lang?.toLowerCase()] || '#AAA';
  }
}

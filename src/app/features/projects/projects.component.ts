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
    <div class="page" #page>
      <div class="page-hdr">
        <h1 class="bb">Projects</h1>
        <div class="hdr-right">
          <div class="search-box">
            <span class="s-ic">&#128269;</span>
            <input [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search projects…" class="s-inp" />
            <button class="s-clr" *ngIf="searchQuery" (click)="searchQuery='';onSearch()">X</button>
          </div>
          <button routerLink="/projects/new" class="nb-btn yb">+ New Project</button>
        </div>
      </div>
      <div class="tab-bar">
        <button class="tab" [class.active]="tab==='mine'" (click)="setTab('mine')">My Projects ({{myProjects.length}})</button>
        <button class="tab" [class.active]="tab==='member'" (click)="setTab('member')">Member Of ({{memberProjects.length}})</button>
        <button class="tab" [class.active]="tab==='public'" (click)="setTab('public')">Explore ({{publicProjects.length}})</button>
      </div>
      <div class="search-info" *ngIf="searchQuery">Showing {{displayed.length}} result(s) for "{{searchQuery}}"</div>
      <div class="projects-grid" #grid>
        <div class="pc" *ngFor="let p of displayed" (click)="open(p.projectId)">
          <div class="pc-bar" [style.background]="getLangColor(p.language)"></div>
          <div class="pc-top">
            <span class="lb" [style.background]="getLangColor(p.language)">{{p.language}}</span>
            <span class="vb" [class.pub]="p.visibility==='PUBLIC'">{{p.visibility}}</span>
            <span class="ab" *ngIf="p.archived">Archived</span>
          </div>
          <h3>{{p.name}}</h3>
          <p class="pdesc">{{p.description||'No description.'}}</p>
          <div class="pc-foot">
            <span>&#11088; {{p.starCount}}</span>
            <span>&#127860; {{p.forkCount}}</span>
            <div class="ca">
              <button class="ib sb" (click)="star(p.projectId,$event)">&#11088;</button>
              <button class="ib fb" (click)="fork(p.projectId,$event)">&#127860;</button>
            </div>
          </div>
        </div>
        <div class="empty" *ngIf="!displayed.length">
          <div style="font-size:48px">{{searchQuery?'&#128269;':'&#128194;'}}</div>
          <p>{{searchQuery?'No results for '+searchQuery:'No projects here yet.'}}</p>
          <a routerLink="/projects/new" class="nb-btn yb" *ngIf="!searchQuery">Create First Project</a>
          <button class="nb-btn ob" (click)="searchQuery='';onSearch()" *ngIf="searchQuery">Clear Search</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:32px;max-width:1200px;margin:0 auto}
    .page-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
    h1.bb{font-family:'Bebas Neue',sans-serif;font-size:56px;letter-spacing:.05em;margin:0;color:#0A0A0A}
    .hdr-right{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .search-box{display:flex;align-items:center;border:3px solid #0A0A0A;box-shadow:4px 4px 0 #0A0A0A;background:#fff}
    .search-box:focus-within{border-color:#1E88E5;box-shadow:4px 4px 0 #1E88E5}
    .s-ic{padding:0 10px;font-size:14px}
    .s-inp{border:none;outline:none;padding:10px 0;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;background:transparent;color:#0A0A0A;width:200px}
    .s-inp::placeholder{color:#aaa}
    .s-clr{border:none;background:#0A0A0A;color:#FDD835;cursor:pointer;padding:0 10px;font-size:11px;font-weight:800;align-self:stretch}
    .nb-btn{border:3px solid #0A0A0A;padding:10px 18px;font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer;box-shadow:4px 4px 0 #0A0A0A;text-decoration:none;display:inline-flex;align-items:center;transition:transform .08s,box-shadow .08s}
    .nb-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #0A0A0A}
    .yb{background:#FDD835;color:#0A0A0A}
    .ob{background:#fff;color:#0A0A0A}
    .tab-bar{display:flex;border-bottom:3px solid #0A0A0A;margin-bottom:20px}
    .tab{background:transparent;border:none;color:#888;font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:10px 18px;cursor:pointer;transition:all .15s;border-bottom:3px solid transparent;margin-bottom:-3px}
    .tab.active{color:#0A0A0A;background:#FDD835;border-bottom-color:#0A0A0A}
    .tab:hover:not(.active){color:#0A0A0A;background:rgba(0,0,0,.04)}
    .search-info{background:#E3F2FD;border:3px solid #1E88E5;box-shadow:3px 3px 0 #1E88E5;padding:10px 16px;font-size:13px;font-weight:600;margin-bottom:16px}
    .projects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
    .pc{border:3px solid #0A0A0A;background:#fff;cursor:pointer;box-shadow:5px 5px 0 #0A0A0A;transition:transform .1s,box-shadow .1s;display:flex;flex-direction:column;overflow:hidden}
    .pc:hover{transform:translate(-3px,-3px);box-shadow:8px 8px 0 #0A0A0A;background:#FFFDE7}
    .pc-bar{height:6px;width:100%;flex-shrink:0}
    .pc-top{display:flex;align-items:center;gap:6px;padding:14px 16px 0;flex-wrap:wrap}
    .lb{color:#fff;border:2px solid #0A0A0A;padding:2px 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px}
    .vb{border:2px solid #0A0A0A;padding:2px 8px;font-size:10px;font-weight:800;text-transform:uppercase;background:#eee;color:#555}
    .vb.pub{background:#43A047;color:#fff}
    .ab{background:#FB8C00;color:#fff;border:2px solid #0A0A0A;padding:2px 8px;font-size:10px;font-weight:800;text-transform:uppercase}
    .pc h3{font-size:16px;font-weight:800;margin:10px 16px 6px;color:#0A0A0A}
    .pdesc{font-size:13px;color:#555;margin:0 16px auto;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;padding-bottom:12px;flex:1}
    .pc-foot{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#555;border-top:2px solid #0A0A0A;padding:10px 16px}
    .ca{margin-left:auto;display:flex;gap:4px}
    .ib{border:2px solid #0A0A0A;cursor:pointer;padding:4px 8px;font-size:11px;font-weight:800;transition:background .1s,transform .08s}
    .ib:hover{transform:translate(-1px,-1px)}
    .sb{background:#FDD835;color:#0A0A0A}
    .fb{background:#1E88E5;color:#fff}
    .empty{text-align:center;padding:60px 20px;grid-column:1/-1;border:3px dashed #ccc}
    .empty p{font-weight:700;margin-bottom:16px;font-size:15px;color:#555}
    @media(max-width:600px){.page{padding:16px} h1.bb{font-size:38px} .s-inp{width:130px}}
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

  star(id: number, e: Event): void {
    e.stopPropagation();
    this.projectSvc.star(id).subscribe(() => this.toast.success('Starred!'));
  }

  fork(id: number, e: Event): void {
    e.stopPropagation();
    this.projectSvc.fork(id).subscribe(() => {
      this.toast.success('Project forked!');
      const user = this.authSvc.getCurrentUser();
      if (user) this.projectSvc.getByOwner(user.userId).subscribe(p => { this.myProjects = p; this.updateDisplayed(); });
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
      <div class="project-hero" #hero>
        <div class="hero-left">
          <div class="breadcrumbs">
            <a routerLink="/projects">Projects</a> / {{ project.name }}
          </div>
          <h1>{{ project.name }}</h1>
          <p class="description">{{ project.description || 'No description provided.' }}</p>
          <div class="badges">
            <span class="lang-badge">{{ project.language }}</span>
            <span class="vis-badge" [class.public]="project.visibility === 'PUBLIC'">{{ project.visibility }}</span>
            <span class="archived-badge" *ngIf="project.archived">Archived</span>
          </div>
          <div class="meta">
            <span>⭐ {{ project.starCount }} stars</span>
            <span>🍴 {{ project.forkCount }} forks</span>
            <span>👥 {{ (project.memberIds || []).length }} members</span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn-primary" [routerLink]="['/editor', project.projectId]">Open Editor</button>
          <button class="btn-outline" (click)="star()">⭐ Star</button>
          <button class="btn-outline" (click)="fork()">🍴 Fork</button>
        </div>
      </div>

      <!-- Files -->
      <div class="section" #filesSection>
        <h2>Files</h2>
        <div class="file-list">
          <div class="file-row" *ngFor="let f of files">
            <span class="file-icon">{{ getIcon(f.language) }}</span>
            <span class="file-name">{{ f.name }}</span>
            <span class="file-path">{{ f.path }}</span>
            <span class="file-lang">{{ f.language }}</span>
          </div>
          <div class="empty-files" *ngIf="!files.length">No files yet. Open the editor to create files.</div>
        </div>
      </div>
    </div>
    <div class="loading" *ngIf="!project">Loading…</div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .loading { color: rgba(255,255,255,0.5); text-align: center; padding: 60px; }
    .project-hero { display: flex; align-items: flex-start; justify-content: space-between;
      gap: 24px; margin-bottom: 40px; padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.08); }
    .breadcrumbs { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 12px; }
    .breadcrumbs a { color: #818cf8; text-decoration: none; }
    h1 { color: #fff; font-size: 28px; margin: 0 0 8px; }
    .description { color: rgba(255,255,255,0.6); font-size: 15px; margin: 0 0 16px; }
    .badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .lang-badge { background: rgba(99,102,241,0.2); color: #818cf8; border-radius: 6px; padding: 3px 10px; font-size: 13px; }
    .vis-badge { border-radius: 6px; padding: 3px 10px; font-size: 13px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
    .vis-badge.public { background: rgba(34,197,94,0.15); color: #4ade80; }
    .archived-badge { background: rgba(245,158,11,0.15); color: #fbbf24; border-radius: 6px; padding: 3px 10px; font-size: 12px; }
    .meta { display: flex; gap: 24px; color: rgba(255,255,255,0.5); font-size: 13px; }
    .hero-actions { display: flex; flex-direction: column; gap: 10px; min-width: 160px; }
    .btn-primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none;
      border-radius: 10px; padding: 12px 20px; color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; text-align: center; text-decoration: none; }
    .btn-outline { background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
      padding: 10px 20px; color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer;
      transition: border-color 0.2s; }
    .btn-outline:hover { border-color: #6366f1; }
    .section h2 { color: #fff; font-size: 20px; margin: 0 0 16px; }
    .file-list { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; overflow: hidden; }
    .file-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; font-size: 13px;
      border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
    .file-row:last-child { border-bottom: none; }
    .file-row:hover { background: rgba(255,255,255,0.04); }
    .file-icon { font-size: 16px; }
    .file-name { color: #e2e8f0; font-weight: 500; }
    .file-path { color: rgba(255,255,255,0.4); margin-left: 4px; font-family: monospace; }
    .file-lang { margin-left: auto; background: rgba(99,102,241,0.15); color: #818cf8;
      border-radius: 4px; padding: 2px 8px; font-size: 11px; }
    .empty-files { color: rgba(255,255,255,0.4); text-align: center; padding: 32px; }
  `]
})
export class ProjectDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('hero') heroRef!: ElementRef;
  @ViewChild('filesSection') filesSectionRef!: ElementRef;

  private route = inject(ActivatedRoute);
  private projectSvc = inject(ProjectService);
  private fileSvc = inject(FileService);
  private toast = inject(ToastService);

  project: Project | null = null;
  files: CodeFile[] = [];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.projectSvc.getById(id).subscribe(p => { this.project = p; });
    this.fileSvc.getTree(id).subscribe(f => this.files = f.filter(x => !x.deleted));
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.heroRef) {
        gsap.fromTo(this.heroRef.nativeElement,
          { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      }
    }, 100);
  }

  star(): void { this.projectSvc.star(this.project!.projectId).subscribe(() => this.toast.success('Starred!')); }
  fork(): void { this.projectSvc.fork(this.project!.projectId).subscribe(() => this.toast.success('Forked!')); }
  getIcon(lang: string): string {
    const m: Record<string, string> = { java: '☕', python: '🐍', javascript: '🟨', typescript: '🔷' };
    return m[lang?.toLowerCase()] || '📄';
  }
}

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
      <!-- Top Banner / Hero -->
      <div class="nb-hero" #hero>
        <div class="hero-content">
          <div class="breadcrumbs">
            <a routerLink="/projects">PROJECTS</a> / <span class="active">{{ project.name }}</span>
          </div>
          <h1 class="bb">{{ project.name }}</h1>
          <p class="desc">{{ project.description || 'No description provided for this project.' }}</p>

          <div class="badges">
            <span class="nb-badge" [style.background]="getLangColor(project.language)">{{ project.language }}</span>
            <span class="nb-badge" [class.blue]="project.visibility === 'PRIVATE'" [class.green]="project.visibility === 'PUBLIC'">
              {{ project.visibility }}
            </span>
            <span class="nb-badge red" *ngIf="project.archived">ARCHIVED</span>
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
      <div class="stats-grid">
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

      <!-- Files Section -->
      <div class="content-row">
        <div class="main-col">
          <div class="nb-card" #filesSection>
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
        <div class="side-col">
          <div class="nb-card">
            <div class="nb-card-hdr blue-hdr">
              <span class="card-label">ABOUT</span>
            </div>
            <div class="card-body">
              <div class="info-item">
                <label>OWNER ID</label>
                <div>#{{ project.ownerId }}</div>
              </div>
              <div class="info-item">
                <label>CREATED</label>
                <div>{{ project.createdAt | date:'MMM d, y' }}</div>
              </div>
              <div class="info-item">
                <label>LAST UPDATE</label>
                <div>{{ project.updatedAt | date:'short' }}</div>
              </div>
            </div>
          </div>

          <div class="nb-card mt-24">
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
        </div>
      </div>
    </div>

    <div class="loading-wrap" *ngIf="!project">
      <div class="nb-loader"></div>
      <p>FETCHING PROJECT DATA...</p>
    </div>
  `,
  styles: [`
    .page { padding: 40px 24px; max-width: 1200px; margin: 0 auto; min-height: 100vh; }

    /* ── Hero ── */
    .nb-hero { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 32px; flex-wrap: wrap; }
    .hero-content { flex: 1; min-width: 300px; }
    .breadcrumbs { font-size: 11px; font-weight: 800; color: #666; margin-bottom: 8px; letter-spacing: 1px; }
    .breadcrumbs a { color: var(--B); text-decoration: none; }
    .breadcrumbs .active { color: var(--K); }
    h1.bb { font-size: 48px; margin: 0 0 12px; line-height: 1; letter-spacing: -1px; text-transform: uppercase; }
    .desc { font-size: 18px; color: #444; font-weight: 500; margin-bottom: 20px; max-width: 600px; }

    .badges { display: flex; gap: 10px; }
    .nb-badge { padding: 4px 12px; border: 2px solid var(--K); font-size: 11px; font-weight: 800; text-transform: uppercase; border-radius: 4px; background: var(--W); box-shadow: 2px 2px 0 var(--K); }
    .nb-badge.blue { background: var(--B); color: #fff; }
    .nb-badge.green { background: var(--G); color: #fff; }
    .nb-badge.red { background: var(--R); color: #fff; }

    .hero-actions { display: flex; flex-direction: column; gap: 16px; width: 340px; }
    .social-row { display: flex; gap: 12px; }
    .nb-btn { border: 3px solid var(--K); padding: 14px 20px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; cursor: pointer; font-size: 14px; box-shadow: 4px 4px 0 var(--K); transition: all .1s; text-transform: uppercase; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
    .nb-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--K); }
    .nb-btn.active { background: var(--K) !important; color: #fff !important; }
    .btn-blue { background: var(--B); color: #fff; }
    .btn-yellow { background: var(--Y); color: var(--K); }
    .btn-white { background: var(--W); color: var(--K); }
    .main-cta { font-size: 18px; padding: 20px; }
    .flex-1 { flex: 1; }

    /* ── Stats ── */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
    .stat-card { border: 3px solid var(--K); background: var(--W); padding: 20px; box-shadow: 6px 6px 0 var(--K); text-align: center; }
    .stat-card .val { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .stat-card .lbl { font-size: 10px; font-weight: 800; color: #666; letter-spacing: 1.5px; }

    /* ── Content ── */
    .content-row { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
    .nb-card { border: 3px solid var(--K); background: var(--W); box-shadow: 6px 6px 0 var(--K); overflow: hidden; }
    .nb-card-hdr { padding: 12px 20px; border-bottom: 3px solid var(--K); display: flex; align-items: center; gap: 12px; }
    .yellow-hdr { background: var(--Y); }
    .blue-hdr { background: var(--B); color: #fff; }
    .green-hdr { background: var(--G); color: #fff; }
    .card-label { font-size: 12px; font-weight: 800; letter-spacing: 1.5px; }
    .hdr-accent { flex: 1; height: 3px; background: rgba(0,0,0,0.1); }

    .file-list { display: flex; flex-direction: column; }
    .file-row { display: flex; align-items: center; padding: 16px 20px; border-bottom: 2px solid var(--O); transition: background .15s; }
    .file-row:last-child { border-bottom: none; }
    .file-row:hover { background: var(--O); }
    .f-icon { font-size: 24px; margin-right: 16px; }
    .f-info { flex: 1; display: flex; flex-direction: column; }
    .f-name { font-weight: 700; font-size: 15px; }
    .f-path { font-size: 12px; color: #777; font-family: monospace; }
    .f-lang { font-size: 10px; font-weight: 800; padding: 2px 8px; border: 2px solid var(--K); border-radius: 4px; text-transform: uppercase; background: var(--O); }

    .card-body { padding: 20px; }
    .info-item { margin-bottom: 16px; }
    .info-item:last-child { margin-bottom: 0; }
    .info-item label { display: block; font-size: 9px; font-weight: 800; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
    .info-item div { font-weight: 700; font-size: 14px; }

    .collab-list { padding: 12px; }
    .collab-item { display: flex; align-items: center; gap: 12px; padding: 8px; }
    .avatar-sm { width: 32px; height: 32px; border: 2px solid var(--K); background: var(--O); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; border-radius: 4px; }

    .empty-files { padding: 60px 20px; text-align: center; color: #888; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: .5; }

    .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 16px; }
    .nb-loader { width: 40px; height: 40px; border: 6px solid var(--O); border-top-color: var(--B); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .mt-24 { margin-top: 24px; }

    @media (max-width: 900px) {
      .content-row { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .hero-actions { width: 100%; }
    }
  `]
})
export class ProjectDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('hero') heroRef!: ElementRef;
  @ViewChild('filesSection') filesSectionRef!: ElementRef;

  private route = inject(ActivatedRoute);
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
          { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
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
    this.projectSvc.star(this.project.projectId).subscribe(() => {
      this.toast.success(this.isStarred ? 'Unstarred!' : 'Starred!');
      this.loadProject(this.project!.projectId);
    });
  }

  fork(): void {
    if (!this.project) return;
    this.projectSvc.fork(this.project.projectId).subscribe({
      next: (res) => {
        this.toast.success(this.isForked ? 'Fork deleted!' : 'Fork created!');
        this.loadProject(this.project!.projectId);
      },
      error: () => this.toast.error('Action failed')
    });
  }

  getIcon(lang: string): string {
    const m: Record<string, string> = {
      java: '☕', python: '🐍', javascript: '🟨', typescript: '🔷',
      go: '🐹', rust: '🦀', html: '🌐', css: '🎨'
    };
    return m[lang?.toLowerCase()] || '📄';
  }

  getLangColor(lang: string): string {
    const m: Record<string, string> = {
      java: '#FFD600', python: '#1A6FFF', javascript: '#FFD600',
      typescript: '#1A6FFF', cpp: '#FF2D2D', go: '#00C853'
    };
    return m[lang?.toLowerCase()] || '#DDD';
  }
}

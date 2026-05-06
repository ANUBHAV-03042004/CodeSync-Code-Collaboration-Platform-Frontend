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
      <div class="page-header">
        <h1>Projects</h1>
        <div class="header-actions">
          <input [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search projects…" class="search-input" />
          <button routerLink="/projects/new" class="btn-primary">+ New Project</button>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab" [class.active]="tab === 'mine'" (click)="setTab('mine')">My Projects</button>
        <button class="tab" [class.active]="tab === 'member'" (click)="setTab('member')">Member Of</button>
        <button class="tab" [class.active]="tab === 'public'" (click)="setTab('public')">Explore</button>
      </div>

      <div class="projects-grid" #grid>
        <div class="project-card" *ngFor="let p of displayed" (click)="open(p.projectId)">
          <div class="project-top">
            <span class="lang-badge">{{ p.language }}</span>
            <span class="vis-badge" [class.public]="p.visibility === 'PUBLIC'">{{ p.visibility }}</span>
            <span class="archived-badge" *ngIf="p.archived">Archived</span>
          </div>
          <h3>{{ p.name }}</h3>
          <p class="desc">{{ p.description || 'No description' }}</p>
          <div class="project-meta">
            <span>⭐ {{ p.starCount }}</span>
            <span>🍴 {{ p.forkCount }}</span>
            <div class="card-actions">
              <button class="icon-btn" (click)="star(p.projectId, $event)" title="Star">⭐</button>
              <button class="icon-btn" (click)="fork(p.projectId, $event)" title="Fork">🍴</button>
            </div>
          </div>
        </div>
        <div class="empty" *ngIf="!displayed.length">
          <p>No projects found.</p>
          <a routerLink="/projects/new" class="btn-primary">Create your first project</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 28px; margin: 0; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .search-input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px; padding: 10px 16px; color: #fff; font-size: 14px; outline: none; width: 240px; }
    .btn-primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none;
      border-radius: 10px; padding: 10px 20px; color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; text-decoration: none; }
    .tab-bar { display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; }
    .tab { background: none; border: none; border-bottom: 2px solid transparent;
      color: rgba(255,255,255,0.5); font-size: 14px; padding: 10px 20px; cursor: pointer;
      transition: color 0.2s, border-color 0.2s; }
    .tab.active { color: #818cf8; border-bottom-color: #6366f1; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .project-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; }
    .project-card:hover { border-color: #6366f1; transform: translateY(-2px); background: rgba(99,102,241,0.08); }
    .project-top { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
    .lang-badge { background: rgba(99,102,241,0.2); color: #818cf8; border-radius: 6px; padding: 2px 8px; font-size: 12px; }
    .vis-badge { border-radius: 6px; padding: 2px 8px; font-size: 12px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
    .vis-badge.public { background: rgba(34,197,94,0.15); color: #4ade80; }
    .archived-badge { background: rgba(245,158,11,0.15); color: #fbbf24; border-radius: 6px; padding: 2px 8px; font-size: 11px; }
    .project-card h3 { color: #fff; font-size: 16px; margin: 0 0 8px; }
    .desc { color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 16px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .project-meta { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.5); font-size: 13px; }
    .card-actions { margin-left: auto; display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer;
      padding: 4px 6px; border-radius: 4px; font-size: 13px; }
    .icon-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .empty { text-align: center; color: rgba(255,255,255,0.4); padding: 60px; grid-column: 1/-1; }
    .empty p { margin-bottom: 16px; }
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
}

// ── Project Create ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-card" #card>
        <h1>New Project</h1>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Project Name *</label>
            <input type="text" formControlName="name" placeholder="my-awesome-project" />
            <span class="error" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">Name required</span>
          </div>
          <div class="field">
            <label>Description</label>
            <textarea formControlName="description" placeholder="What is this project about?" rows="3"></textarea>
          </div>
          <div class="field">
            <label>Language</label>
            <select formControlName="language">
              <option value="" disabled>Select language</option>
              <option *ngFor="let lang of languages" [value]="lang">{{ lang }}</option>
            </select>
          </div>
          <div class="field">
            <label>Visibility</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" formControlName="visibility" value="PUBLIC" />
                🌐 Public — Anyone can view
              </label>
              <label class="radio-label">
                <input type="radio" formControlName="visibility" value="PRIVATE" />
                🔒 Private — Only members
              </label>
            </div>
          </div>
          <div class="form-actions">
            <a routerLink="/projects" class="btn-outline">Cancel</a>
            <button type="submit" [disabled]="loading" class="btn-primary">
              {{ loading ? 'Creating…' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; display: flex; align-items: flex-start; justify-content: center;
      padding: 60px 24px; background: #0f0f1a; }
    .page-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; padding: 40px; width: 100%; max-width: 560px; }
    h1 { color: #fff; font-size: 24px; margin: 0 0 32px; }
    .field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .field label { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; }
    .field input, .field textarea, .field select {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 14px; outline: none;
      font-family: inherit; resize: vertical; }
    .field input:focus, .field textarea:focus, .field select:focus { border-color: #6366f1; }
    .field select option { background: #1e1e30; }
    .error { color: #f87171; font-size: 12px; }
    .radio-group { display: flex; flex-direction: column; gap: 12px; }
    .radio-label { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.7);
      font-size: 14px; cursor: pointer; padding: 12px 16px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1); transition: border-color 0.2s; }
    .radio-label:hover { border-color: #6366f1; }
    .radio-label input { accent-color: #6366f1; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px; }
    .btn-primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none;
      border-radius: 10px; padding: 12px 24px; color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
      padding: 12px 24px; color: rgba(255,255,255,0.7); font-size: 14px; text-decoration: none;
      transition: border-color 0.2s; }
    .btn-outline:hover { border-color: rgba(255,255,255,0.3); }
  `]
})
export class ProjectCreateComponent implements AfterViewInit {
  @ViewChild('card') cardRef!: ElementRef;
  private fb = inject(FormBuilder);
  private projectSvc = inject(ProjectService);
  private router = inject(Router);
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

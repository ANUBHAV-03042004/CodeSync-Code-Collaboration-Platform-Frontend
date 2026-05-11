import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectCreateComponent, ProjectDetailComponent } from '../features/projects/projects.component';
import { ProjectService } from '../services/project.service';
import { FileService } from '../services/file.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../shared/components/toast/toast.service';

const mockProject = {
  projectId: 42, name: 'Demo', description: 'A demo project', language: 'Go',
  visibility: 'PUBLIC' as const, ownerId: 1, memberIds: [1, 2],
  starCount: 10, forkCount: 3, archived: false, createdAt: '', updatedAt: '',
  starredBy: [], forkedBy: []
};

const makeProjectSvc = () => ({
  create: jest.fn().mockReturnValue(of(mockProject)),
  getById: jest.fn().mockReturnValue(of(mockProject)),
  star: jest.fn().mockReturnValue(of(null)),
  fork: jest.fn().mockReturnValue(of({ ...mockProject, projectId: 99 }))
});

const makeToast = () => ({
  success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), toast$: of()
});

const makeAuth = () => ({
  getCurrentUser: jest.fn().mockReturnValue({ userId: 1, username: 'alice' }),
  isLoggedIn: jest.fn().mockReturnValue(true)
});

// ── ProjectCreateComponent ─────────────────────────────────────────────────
describe('ProjectCreateComponent', () => {
  let component: ProjectCreateComponent;
  let fixture: ComponentFixture<ProjectCreateComponent>;
  let projectSvc: ReturnType<typeof makeProjectSvc>;
  let toastSvc: ReturnType<typeof makeToast>;
  let router: Router;

  beforeEach(async () => {
    projectSvc = makeProjectSvc();
    toastSvc = makeToast();

    await TestBed.configureTestingModule({
      imports: [ProjectCreateComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [
        { provide: ProjectService, useValue: projectSvc },
        { provide: ToastService, useValue: toastSvc }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCreateComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should initialize with PUBLIC visibility', () => {
    expect(component.form.get('visibility')?.value).toBe('PUBLIC');
  });

  it('should be invalid when name is empty', () => {
    component.form.patchValue({ name: '', language: 'Java', visibility: 'PUBLIC' });
    expect(component.form.invalid).toBe(true);
  });

  it('should be invalid when language is empty', () => {
    component.form.patchValue({ name: 'MyProject', language: '', visibility: 'PUBLIC' });
    expect(component.form.invalid).toBe(true);
  });

  it('should be valid with required fields', () => {
    component.form.patchValue({ name: 'MyProject', language: 'Java', visibility: 'PRIVATE' });
    expect(component.form.valid).toBe(true);
  });

  it('should mark all fields touched on invalid submit', () => {
    component.onSubmit();
    expect(component.form.get('name')?.touched).toBe(true);
  });

  it('should call projectSvc.create on valid submit', () => {
    component.form.patchValue({ name: 'MyProject', language: 'Python', visibility: 'PUBLIC' });
    component.onSubmit();
    expect(projectSvc.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'MyProject', language: 'Python' })
    );
  });

  it('should navigate to project page after create', () => {
    const navSpy = jest.spyOn(router, 'navigate');
    component.form.patchValue({ name: 'MyProject', language: 'Python', visibility: 'PUBLIC' });
    component.onSubmit();
    expect(navSpy).toHaveBeenCalledWith(['/projects', 42]);
  });

  it('should show error toast when create fails', () => {
    projectSvc.create.mockReturnValue(throwError(() => new Error('Server error')));
    component.form.patchValue({ name: 'MyProject', language: 'Python', visibility: 'PUBLIC' });
    component.onSubmit();
    expect(toastSvc.error).toHaveBeenCalled();
  });

  it('should set loading false after error', () => {
    projectSvc.create.mockReturnValue(throwError(() => new Error()));
    component.form.patchValue({ name: 'MyProject', language: 'Python', visibility: 'PUBLIC' });
    component.onSubmit();
    expect(component.loading).toBe(false);
  });

  it('should have expected languages', () => {
    expect(component.languages).toContain('Java');
    expect(component.languages).toContain('Python');
    expect(component.languages).toContain('TypeScript');
  });
});

// ── ProjectDetailComponent ─────────────────────────────────────────────────
describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let projectSvc: ReturnType<typeof makeProjectSvc>;
  let fileSvc: any;
  let toastSvc: ReturnType<typeof makeToast>;

  const mockFiles = [
    { fileId: 1, name: 'Main.java', path: 'src/', language: 'Java', folder: false, deleted: false },
    { fileId: 2, name: 'util/', path: 'src/', language: '', folder: true, deleted: false },
    { fileId: 3, name: 'OldFile.java', path: 'src/', language: 'Java', folder: false, deleted: true }
  ];

  beforeEach(async () => {
    projectSvc = makeProjectSvc();
    fileSvc = { getTree: jest.fn().mockReturnValue(of(mockFiles)) };
    toastSvc = makeToast();

    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent, RouterTestingModule],
      providers: [
        { provide: ProjectService, useValue: projectSvc },
        { provide: FileService, useValue: fileSvc },
        { provide: ToastService, useValue: toastSvc },
        { provide: AuthService, useValue: makeAuth() },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '42' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load project by id from route', () => {
    expect(projectSvc.getById).toHaveBeenCalledWith(42);
    expect(component.project?.projectId).toBe(42);
  });

  it('should load file tree on init', () => {
    expect(fileSvc.getTree).toHaveBeenCalledWith(42);
  });

  it('should filter out deleted files', () => {
    expect(component.files.length).toBe(1);
    expect(component.files.every((f: any) => !f.deleted)).toBe(true);
  });

  it('should star project', () => {
    component.star();
    expect(projectSvc.star).toHaveBeenCalledWith(42);
    expect(toastSvc.success).toHaveBeenCalledWith('Project Starred!');
  });

  it('should fork project', () => {
    component.fork();
    expect(projectSvc.fork).toHaveBeenCalledWith(42);
    expect(toastSvc.success).toHaveBeenCalledWith('Project Forked Successfully!');
  });

  it('should return correct file icons', () => {
    expect(component.getIcon('java')).toBe('☕');
    expect(component.getIcon('python')).toBe('🐍');
    expect(component.getIcon('unknown')).toBe('📄');
  });
});

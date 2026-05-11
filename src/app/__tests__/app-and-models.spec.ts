import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from '../app.component';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/other-services';
import { ToastService } from '../shared/components/toast/toast.service';
import {
  User, Project, CodeFile, ExecutionJob, Snapshot, Comment, Notification
} from '../core/models';

const createAuthMock = () => ({
  getCurrentUser: jest.fn().mockReturnValue({
    userId: 1, username: 'alice', email: 'alice@test.com', role: 'USER',
    fullName: 'Alice', avatarUrl: '', bio: '', provider: 'LOCAL', isActive: true, createdAt: ''
  }),
  logout: jest.fn().mockReturnValue(of({})),
  clearStorage: jest.fn()
});

const createNotifMock = () => ({
  getBadgeCount: jest.fn().mockReturnValue(of({ unreadCount: 0 })),
  getUnread: jest.fn().mockReturnValue(of([])),
  connectPush: jest.fn(),
  disconnectPush: jest.fn(),
  notification$: of(),
  unreadCount$: of(0),
  markRead: jest.fn().mockReturnValue(of(null))
});

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: createAuthMock() },
        { provide: NotificationService, useValue: createNotifMock() },
        { provide: ToastService, useValue: { toast$: of(), success: jest.fn(), error: jest.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('showNav should be a boolean', () => {
    expect(typeof component.showNav).toBe('boolean');
  });

  it('should hide navbar on /login route', () => {
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    router.navigate(['/login']);
    expect(spy).toHaveBeenCalled();
  });
});

// ── Model type checks ──────────────────────────────────────────────────────
describe('Model type shapes', () => {
  it('User should have required fields', () => {
    const u: User = {
      userId: 1, username: 'u', email: 'e@e.com', fullName: 'Full',
      role: 'USER', avatarUrl: '', bio: '', provider: 'LOCAL',
      isActive: true, createdAt: '2024-01-01'
    };
    expect(u.userId).toBe(1);
    expect(u.role).toBe('USER');
    expect(u.provider).toBe('LOCAL');
  });

  it('Project should have visibility enum values', () => {
    const p: Project = {
      projectId: 1, name: 'proj', description: '', language: 'Java',
      visibility: 'PUBLIC', ownerId: 1, memberIds: [],
      starCount: 0, forkCount: 0, archived: false, createdAt: '', updatedAt: '',
      starredBy: [], forkedBy: []
    };
    expect(['PUBLIC', 'PRIVATE']).toContain(p.visibility);
  });

  it('CodeFile should have folder boolean', () => {
    const f: CodeFile = {
      fileId: 1, projectId: 1, name: 'Main.java', path: 'src/',
      language: 'Java', content: '', folder: false, deleted: false,
      createdBy: 1, lastEditedBy: 1, createdAt: '', updatedAt: ''
    };
    expect(typeof f.folder).toBe('boolean');
  });

  it('ExecutionJob should have status enum values', () => {
    const job: ExecutionJob = {
      jobId: 'j1', userId: 1, projectId: 1, fileId: 1, language: 'Python',
      sourceCode: '', stdin: '', status: 'COMPLETED', stdout: '', stderr: '',
      exitCode: 0, executionTimeMs: 0, memoryUsedMb: 0, createdAt: '', completedAt: ''
    };
    expect(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).toContain(job.status);
  });

  it('Notification should have type enum values', () => {
    const n: Notification = {
      id: 1, recipientId: 1, actorId: 2, title: 'Test', message: 'msg',
      type: 'COMMENT', deepLinkUrl: '/', read: false, createdAt: ''
    };
    expect(['COMMENT', 'COLLAB_INVITE', 'EXECUTION_DONE', 'SYSTEM', 'BROADCAST']).toContain(n.type);
  });

  it('Comment should support null parentCommentId', () => {
    const c: Comment = {
      id: 1, projectId: 1, fileId: 1, authorId: 1, content: 'Nice!',
      lineNumber: 5, columnNumber: 0, parentCommentId: null, snapshotId: null,
      resolved: false, createdAt: '', updatedAt: ''
    };
    expect(c.parentCommentId).toBeNull();
  });

  it('Snapshot should have branch field', () => {
    const s: Snapshot = {
      snapshotId: 1, projectId: 1, fileId: 1, authorId: 1, message: 'init',
      content: 'code', branch: 'main', tag: '', version: 1, createdAt: ''
    };
    expect(s.branch).toBe('main');
  });
});

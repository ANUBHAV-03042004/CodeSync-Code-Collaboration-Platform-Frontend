import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from '../project.service';
import { FileService } from '../file.service';
import { ExecutionService, VersionService, CommentService, NotificationService } from '../other-services';
import { environment } from '../../../environments/environment';

// ── ProjectService ────────────────────────────────────────────────────────────
describe('ProjectService', () => {
  let service: ProjectService;
  let http: HttpTestingController;
  const BASE = `${environment.apiBase}/api/v1/projects`;

  const mockProject = {
    projectId: 1, name: 'Test', description: 'desc', language: 'Java',
    visibility: 'PUBLIC' as const, ownerId: 1, memberIds: [], starCount: 5,
    forkCount: 2, archived: false, createdAt: '', updatedAt: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [ProjectService] });
    service = TestBed.inject(ProjectService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('should POST to create', () => {
    service.create({ name: 'Test', description: '', language: 'Java', visibility: 'PUBLIC' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockProject);
  });

  it('should GET by id', () => {
    service.getById(1).subscribe(p => expect(p.projectId).toBe(1));
    http.expectOne(`${BASE}/1`).flush(mockProject);
  });

  it('should GET by owner', () => {
    service.getByOwner(1).subscribe();
    http.expectOne(`${BASE}/owner/1`).flush([mockProject]);
  });

  it('should GET public projects', () => {
    service.getPublic().subscribe();
    http.expectOne(`${BASE}/public`).flush([mockProject]);
  });

  it('should GET search results', () => {
    service.search('test').subscribe();
    http.expectOne(`${BASE}/search?q=test`).flush([]);
  });

  it('should GET by member', () => {
    service.getByMember(1).subscribe();
    http.expectOne(`${BASE}/member/1`).flush([]);
  });

  it('should GET by language', () => {
    service.getByLanguage('Java').subscribe();
    http.expectOne(`${BASE}/language/Java`).flush([]);
  });

  it('should PUT update', () => {
    service.update(1, { name: 'New' }).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockProject);
  });

  it('should PUT archive', () => {
    service.archive(1).subscribe();
    const req = http.expectOne(`${BASE}/1/archive`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should DELETE project', () => {
    service.delete(1).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST fork', () => {
    service.fork(1).subscribe();
    const req = http.expectOne(`${BASE}/1/fork`);
    expect(req.request.method).toBe('POST');
    req.flush(mockProject);
  });

  it('should POST star', () => {
    service.star(1).subscribe();
    const req = http.expectOne(`${BASE}/1/star`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should POST add member', () => {
    service.addMember(1, 2).subscribe();
    http.expectOne(`${BASE}/1/members/2`).flush(mockProject);
  });

  it('should DELETE remove member', () => {
    service.removeMember(1, 2).subscribe();
    const req = http.expectOne(`${BASE}/1/members/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockProject);
  });
});

// ── FileService ───────────────────────────────────────────────────────────────
describe('FileService', () => {
  let service: FileService;
  let http: HttpTestingController;
  const BASE = `${environment.apiBase}/api/v1/files`;

  const mockFile = {
    fileId: 1, projectId: 1, name: 'Main.java', path: 'src/Main.java',
    language: 'Java', content: 'public class Main {}', folder: false,
    deleted: false, createdBy: 1, lastEditedBy: 1, createdAt: '', updatedAt: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [FileService] });
    service = TestBed.inject(FileService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('should POST createFile', () => {
    service.createFile({ projectId: 1, name: 'Main.java', path: 'src/Main.java', language: 'Java', content: '' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockFile);
  });

  it('should POST createFolder', () => {
    service.createFolder({ projectId: 1, name: 'src', path: 'src' }).subscribe();
    http.expectOne(`${BASE}/folder`).flush(mockFile);
  });

  it('should GET file by id', () => {
    service.getById(1).subscribe(f => expect(f.fileId).toBe(1));
    http.expectOne(`${BASE}/1`).flush(mockFile);
  });

  it('should GET files by project', () => {
    service.getByProject(1).subscribe();
    http.expectOne(`${BASE}/project/1`).flush([mockFile]);
  });

  it('should GET file tree', () => {
    service.getTree(1).subscribe();
    http.expectOne(`${BASE}/project/1/tree`).flush([mockFile]);
  });

  it('should GET content', () => {
    service.getContent(1).subscribe(r => expect(r.content).toBe('code'));
    http.expectOne(`${BASE}/1/content`).flush({ content: 'code' });
  });

  it('should PUT update content', () => {
    service.updateContent(1, 'new content').subscribe();
    const req = http.expectOne(`${BASE}/1/content`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ content: 'new content' });
    req.flush(mockFile);
  });

  it('should PUT rename', () => {
    service.rename(1, 'NewName.java').subscribe();
    const req = http.expectOne(`${BASE}/1/rename`);
    expect(req.request.body).toEqual({ name: 'NewName.java' });
    req.flush(mockFile);
  });

  it('should PUT move', () => {
    service.move(1, 'new/path.java').subscribe();
    const req = http.expectOne(`${BASE}/1/move`);
    expect(req.request.body).toEqual({ path: 'new/path.java' });
    req.flush(mockFile);
  });

  it('should DELETE file (soft)', () => {
    service.delete(1).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST restore', () => {
    service.restore(1).subscribe();
    http.expectOne(`${BASE}/1/restore`).flush(mockFile);
  });

  it('should GET search in project', () => {
    service.search(1, 'main').subscribe();
    http.expectOne(`${BASE}/project/1/search?q=main`).flush([]);
  });
});

// ── ExecutionService ──────────────────────────────────────────────────────────
describe('ExecutionService', () => {
  let service: ExecutionService;
  let http: HttpTestingController;
  const BASE = `${environment.apiBase}/api/v1/executions`;

  const mockJob = {
    jobId: 'job-1', userId: 1, projectId: 1, fileId: 1, language: 'Python',
    sourceCode: 'print("hi")', stdin: '', status: 'COMPLETED' as const,
    stdout: 'hi\n', stderr: '', exitCode: 0, executionTimeMs: 120,
    memoryUsedMb: 32, createdAt: '', completedAt: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [ExecutionService] });
    service = TestBed.inject(ExecutionService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('should POST submit job', () => {
    service.submit({ projectId: 1, fileId: 1, language: 'Python', sourceCode: 'print("hi")', stdin: '' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockJob);
  });

  it('should GET job by id', () => {
    service.getJob('job-1').subscribe(j => expect(j.jobId).toBe('job-1'));
    http.expectOne(`${BASE}/job-1`).flush(mockJob);
  });

  it('should GET jobs by user', () => {
    service.getByUser(1).subscribe();
    http.expectOne(`${BASE}/user/1`).flush([mockJob]);
  });

  it('should GET jobs by project', () => {
    service.getByProject(1).subscribe();
    http.expectOne(`${BASE}/project/1`).flush([mockJob]);
  });

  it('should POST cancel', () => {
    service.cancel('job-1').subscribe();
    http.expectOne(`${BASE}/job-1/cancel`).flush(null);
  });

  it('should GET supported languages', () => {
    service.getSupportedLanguages().subscribe(langs => expect(langs).toContain('Python'));
    http.expectOne(`${BASE}/languages`).flush(['Python', 'Java', 'Go']);
  });

  it('should GET stats', () => {
    service.getStats().subscribe();
    http.expectOne(`${BASE}/stats`).flush({ totalJobs: 42 });
  });
});

// ── VersionService ────────────────────────────────────────────────────────────
describe('VersionService', () => {
  let service: VersionService;
  let http: HttpTestingController;
  const BASE = `${environment.apiBase}/api/v1/versions`;

  const mockSnap = {
    snapshotId: 1, projectId: 1, fileId: 1, authorId: 1, message: 'Init',
    content: 'code', branch: 'main', tag: '', version: 1, createdAt: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [VersionService] });
    service = TestBed.inject(VersionService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('should POST createSnapshot', () => {
    service.createSnapshot({ projectId: 1, fileId: 1, message: 'Init', content: 'code', branch: 'main' }).subscribe();
    http.expectOne(BASE).flush(mockSnap);
  });

  it('should GET snapshot by id', () => {
    service.getById(1).subscribe(s => expect(s.snapshotId).toBe(1));
    http.expectOne(`${BASE}/1`).flush(mockSnap);
  });

  it('should GET file history', () => {
    service.getHistory(1).subscribe();
    http.expectOne(`${BASE}/file/1/history`).flush([mockSnap]);
  });

  it('should GET latest snapshot', () => {
    service.getLatest(1).subscribe();
    http.expectOne(`${BASE}/file/1/latest`).flush(mockSnap);
  });

  it('should GET by project', () => {
    service.getByProject(1).subscribe();
    http.expectOne(`${BASE}/project/1`).flush([mockSnap]);
  });

  it('should GET branches', () => {
    service.getBranches(1).subscribe();
    http.expectOne(`${BASE}/project/1/branches`).flush(['main', 'dev']);
  });

  it('should GET by branch', () => {
    service.getByBranch(1, 'main').subscribe();
    http.expectOne(`${BASE}/project/1/branch/main`).flush([mockSnap]);
  });

  it('should GET diff', () => {
    service.diff(1, 2).subscribe();
    http.expectOne(`${BASE}/diff?a=1&b=2`).flush([]);
  });

  it('should POST restore', () => {
    service.restore(1).subscribe();
    http.expectOne(`${BASE}/1/restore`).flush(mockSnap);
  });

  it('should POST createBranch', () => {
    service.createBranch(1, 'feature').subscribe();
    const req = http.expectOne(`${BASE}/branch`);
    expect(req.request.body).toEqual({ fileId: 1, branchName: 'feature' });
    req.flush(mockSnap);
  });

  it('should PUT tagSnapshot', () => {
    service.tagSnapshot(1, 'v1.0').subscribe();
    const req = http.expectOne(`${BASE}/1/tag`);
    expect(req.request.body).toEqual({ tag: 'v1.0' });
    req.flush(mockSnap);
  });
});

// ── CommentService ────────────────────────────────────────────────────────────
describe('CommentService', () => {
  let service: CommentService;
  let http: HttpTestingController;
  const BASE = `${environment.apiBase}/api/v1/comments`;

  const mockComment = {
    id: 1, projectId: 1, fileId: 1, authorId: 1, content: 'Nice code!',
    lineNumber: 10, columnNumber: 0, parentCommentId: null, snapshotId: null,
    resolved: false, createdAt: '', updatedAt: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [CommentService] });
    service = TestBed.inject(CommentService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('should POST add comment', () => {
    service.add({ projectId: 1, fileId: 1, content: 'Nice!', lineNumber: 5 }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush(mockComment);
  });

  it('should GET by file', () => {
    service.getByFile(1).subscribe();
    http.expectOne(`${BASE}/file/1`).flush([mockComment]);
  });

  it('should GET by project', () => {
    service.getByProject(1).subscribe();
    http.expectOne(`${BASE}/project/1`).flush([mockComment]);
  });

  it('should GET by id', () => {
    service.getById(1).subscribe(c => expect(c.id).toBe(1));
    http.expectOne(`${BASE}/1`).flush(mockComment);
  });

  it('should GET replies', () => {
    service.getReplies(1).subscribe();
    http.expectOne(`${BASE}/1/replies`).flush([]);
  });

  it('should GET by line', () => {
    service.getByLine(1, 10).subscribe();
    http.expectOne(`${BASE}/file/1/line/10`).flush([]);
  });

  it('should GET count', () => {
    service.getCount(1).subscribe(r => expect(r.count).toBe(3));
    http.expectOne(`${BASE}/file/1/count`).flush({ count: 3 });
  });

  it('should PUT update comment', () => {
    service.update(1, 'Updated content').subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.body).toEqual({ content: 'Updated content' });
    req.flush(mockComment);
  });

  it('should DELETE comment', () => {
    service.delete(1).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should PUT resolve', () => {
    service.resolve(1).subscribe();
    http.expectOne(`${BASE}/1/resolve`).flush({ ...mockComment, resolved: true });
  });

  it('should PUT unresolve', () => {
    service.unresolve(1).subscribe();
    http.expectOne(`${BASE}/1/unresolve`).flush(mockComment);
  });
});

// ── NotificationService ───────────────────────────────────────────────────────
describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  const BASE = `${environment.apiBase}/api/v1/notifications`;

  const mockNotif = {
    id: 1, recipientId: 1, actorId: 2, title: 'New comment', message: 'Someone commented',
    type: 'COMMENT' as const, deepLinkUrl: '/projects/1', read: false, createdAt: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('should GET all notifications', () => {
    service.getAll().subscribe(n => expect(n.length).toBe(1));
    http.expectOne(BASE).flush([mockNotif]);
  });

  it('should GET unread', () => {
    service.getUnread().subscribe();
    http.expectOne(`${BASE}/unread`).flush([mockNotif]);
  });

  it('should GET badge count', () => {
    service.getBadgeCount().subscribe(r => expect(r.unreadCount).toBe(3));
    http.expectOne(`${BASE}/badge`).flush({ unreadCount: 3 });
  });

  it('should PUT mark read', () => {
    service.markRead(1).subscribe();
    const req = http.expectOne(`${BASE}/1/read`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should PUT mark all read', () => {
    service.markAllRead().subscribe();
    const req = http.expectOne(`${BASE}/read-all`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should DELETE notification', () => {
    service.delete(1).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should DELETE read notifications', () => {
    service.deleteRead().subscribe();
    const req = http.expectOne(`${BASE}/read`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST broadcast', () => {
    service.broadcast({ recipientIds: [1, 2], title: 'Hello', message: 'World', deepLinkUrl: '/' }).subscribe();
    const req = http.expectOne(`${BASE}/broadcast`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});

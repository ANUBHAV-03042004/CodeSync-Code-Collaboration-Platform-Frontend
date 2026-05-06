import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';
import { FileService } from '../../services/file.service';
import { CollabService } from '../../services/collab.service';
import { ExecutionService, VersionService, CommentService } from '../../services/other-services';
import { AuthService } from '../../services/auth.service';
import { CodeFile, ExecutionJob, CollabSession, CursorPosition } from '../../core/models';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editor-shell" #shell>
      <!-- File Tree Sidebar -->
      <aside class="file-tree" #sidebar>
        <div class="file-tree-header">
          <span class="project-name">{{ projectName }}</span>
          <button class="icon-btn" (click)="showNewFileDialog = true" title="New file">+</button>
        </div>
        <div class="file-list">
          <div class="file-item"
               *ngFor="let f of files"
               [class.active]="f.fileId === activeFile?.fileId"
               (click)="openFile(f)">
            <span class="file-icon">{{ getFileIcon(f.language) }}</span>
            <span class="file-name">{{ f.name }}</span>
          </div>
        </div>
      </aside>

      <!-- Main Editor Area -->
      <main class="editor-main">
        <!-- Tabs -->
        <div class="editor-tabs" #tabs>
          <div class="tab active" *ngIf="activeFile">
            <span>{{ activeFile.name }}</span>
            <span class="unsaved-dot" *ngIf="unsaved">●</span>
          </div>
          <div class="tab-actions">
            <button class="icon-btn" (click)="save()" title="Save (Ctrl+S)" [disabled]="!unsaved">💾</button>
            <button class="icon-btn" (click)="runCode()" title="Run" [disabled]="running">▶</button>
            <button class="icon-btn" (click)="createSnapshot()" title="Create snapshot">📸</button>
            <button class="icon-btn" (click)="toggleVersions()" title="Version history">🕒</button>
            <button class="icon-btn" (click)="toggleCollab()" title="Start collaboration">👥</button>
          </div>
        </div>

        <!-- Collab cursors overlay -->
        <div class="collab-cursors">
          <div class="remote-cursor" *ngFor="let cursor of remoteCursors | keyvalue"
               [style.top]="getCursorTop(cursor.value.line)"
               [style.left]="getCursorLeft(cursor.value.col)">
            <div class="cursor-flag">User {{ cursor.key }}</div>
          </div>
        </div>

        <!-- Monaco Editor placeholder (integrate ngx-monaco-editor-v2 here) -->
        <div class="monaco-container" #monacoContainer>
          <textarea class="code-textarea"
                    [(ngModel)]="editorContent"
                    (input)="onContentChange()"
                    (keydown)="onKeydown($event)"
                    placeholder="Select a file to edit..."
                    spellcheck="false"></textarea>
        </div>

        <!-- Execution Panel -->
        <div class="execution-panel" #execPanel [class.open]="execPanelOpen">
          <div class="panel-header" (click)="execPanelOpen = !execPanelOpen">
            <span>Terminal</span>
            <span class="job-status" [class]="currentJob?.status?.toLowerCase() || ''">
              {{ currentJob?.status || 'Ready' }}
            </span>
          </div>
          <div class="panel-body" *ngIf="execPanelOpen">
            <div class="stdin-row">
              <input [(ngModel)]="stdin" placeholder="stdin input..." class="stdin-input" />
              <button (click)="runCode()" [disabled]="running" class="run-btn">
                {{ running ? '⏳ Running…' : '▶ Run' }}
              </button>
            </div>
            <pre class="output">{{ getOutput() }}</pre>
          </div>
        </div>
      </main>

      <!-- Right Panel: Comments / Versions -->
      <aside class="right-panel" *ngIf="rightPanelMode" #rightPanel>
        <div class="right-panel-header">
          <span>{{ rightPanelMode === 'comments' ? '💬 Comments' : '🕒 Version History' }}</span>
          <button class="icon-btn" (click)="rightPanelMode = null">✕</button>
        </div>

        <!-- Comments -->
        <ng-container *ngIf="rightPanelMode === 'comments'">
          <div class="comment-list">
            <div class="comment" *ngFor="let c of comments">
              <div class="comment-header">
                <span class="comment-author">User {{ c.authorId }}</span>
                <span class="comment-line">Line {{ c.lineNumber }}</span>
                <button class="icon-btn" (click)="resolveComment(c.id)" *ngIf="!c.resolved">✓</button>
              </div>
              <p class="comment-body" [class.resolved]="c.resolved">{{ c.content }}</p>
            </div>
          </div>
          <div class="add-comment">
            <textarea [(ngModel)]="newComment" placeholder="Add a comment…" class="comment-textarea"></textarea>
            <button (click)="addComment()" class="btn-primary-sm">Post</button>
          </div>
        </ng-container>

        <!-- Version History -->
        <ng-container *ngIf="rightPanelMode === 'versions'">
          <div class="version-list">
            <div class="version-item" *ngFor="let snap of snapshots">
              <div class="version-header">
                <span class="version-msg">{{ snap.message }}</span>
                <span class="version-branch">{{ snap.branch }}</span>
              </div>
              <div class="version-meta">v{{ snap.version }} · {{ snap.createdAt | date:'short' }}</div>
              <button class="btn-outline-sm" (click)="restoreSnapshot(snap.id)">Restore</button>
            </div>
          </div>
        </ng-container>
      </aside>
    </div>
  `,
  styles: [`
    .editor-shell { display: flex; height: 100vh; background: #0d0d17; overflow: hidden; }
    .file-tree { width: 220px; background: rgba(255,255,255,0.03); border-right: 1px solid rgba(255,255,255,0.08);
      display: flex; flex-direction: column; flex-shrink: 0; }
    .file-tree-header { padding: 16px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.08); }
    .project-name { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; }
    .file-list { flex: 1; overflow-y: auto; padding: 8px 0; }
    .file-item { display: flex; align-items: center; gap: 8px; padding: 8px 16px;
      cursor: pointer; color: rgba(255,255,255,0.6); font-size: 13px;
      transition: background 0.15s, color 0.15s; }
    .file-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .file-item.active { background: rgba(99,102,241,0.15); color: #a5b4fc; }
    .file-icon { font-size: 14px; }
    .editor-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .editor-tabs { display: flex; align-items: center; background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0 8px; gap: 4px; }
    .tab { display: flex; align-items: center; gap: 6px; padding: 10px 16px;
      color: rgba(255,255,255,0.7); font-size: 13px; border-bottom: 2px solid #6366f1; }
    .unsaved-dot { color: #f59e0b; font-size: 10px; }
    .tab-actions { margin-left: auto; display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer;
      padding: 6px 8px; border-radius: 6px; font-size: 14px; transition: background 0.15s, color 0.15s; }
    .icon-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .collab-cursors { position: absolute; pointer-events: none; z-index: 10; }
    .remote-cursor { position: absolute; }
    .cursor-flag { background: #f59e0b; color: #000; font-size: 11px; padding: 2px 6px;
      border-radius: 4px; white-space: nowrap; }
    .monaco-container { flex: 1; overflow: hidden; position: relative; }
    .code-textarea { width: 100%; height: 100%; background: transparent; border: none;
      color: #e2e8f0; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 14px;
      line-height: 1.6; padding: 16px; resize: none; outline: none; }
    .execution-panel { border-top: 1px solid rgba(255,255,255,0.08); }
    .panel-header { display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; cursor: pointer; color: rgba(255,255,255,0.7); font-size: 13px;
      background: rgba(255,255,255,0.03); }
    .panel-header:hover { background: rgba(255,255,255,0.06); }
    .job-status { font-size: 12px; border-radius: 4px; padding: 2px 8px; }
    .job-status.completed { background: rgba(34,197,94,0.15); color: #4ade80; }
    .job-status.running { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .job-status.failed { background: rgba(239,68,68,0.15); color: #f87171; }
    .panel-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; max-height: 240px; }
    .stdin-row { display: flex; gap: 8px; }
    .stdin-input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 13px; outline: none; }
    .run-btn { background: #22c55e; border: none; border-radius: 6px; padding: 8px 16px;
      color: #000; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .run-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .output { color: #4ade80; font-family: monospace; font-size: 13px; margin: 0;
      overflow-y: auto; max-height: 140px; white-space: pre-wrap; }
    .right-panel { width: 300px; border-left: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02); display: flex; flex-direction: column; }
    .right-panel-header { padding: 16px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); font-size: 14px; }
    .comment-list { flex: 1; overflow-y: auto; padding: 12px; }
    .comment { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .comment-author { color: #818cf8; font-size: 12px; font-weight: 600; }
    .comment-line { color: rgba(255,255,255,0.4); font-size: 11px; }
    .comment-body { color: rgba(255,255,255,0.7); font-size: 13px; margin: 0; }
    .comment-body.resolved { text-decoration: line-through; opacity: 0.5; }
    .add-comment { padding: 12px; border-top: 1px solid rgba(255,255,255,0.08); }
    .comment-textarea { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; resize: vertical;
      outline: none; min-height: 80px; box-sizing: border-box; }
    .btn-primary-sm { background: #6366f1; border: none; border-radius: 6px; padding: 8px 16px;
      color: #fff; font-size: 13px; cursor: pointer; margin-top: 8px; width: 100%; }
    .version-list { flex: 1; overflow-y: auto; padding: 12px; }
    .version-item { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .version-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .version-msg { color: #fff; font-size: 13px; font-weight: 500; }
    .version-branch { background: rgba(99,102,241,0.2); color: #818cf8; border-radius: 4px;
      padding: 2px 6px; font-size: 11px; }
    .version-meta { color: rgba(255,255,255,0.4); font-size: 11px; margin-bottom: 8px; }
    .btn-outline-sm { background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
      padding: 6px 12px; color: rgba(255,255,255,0.7); font-size: 12px; cursor: pointer; }
    .btn-outline-sm:hover { border-color: #6366f1; color: #818cf8; }
  `]
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('shell') shellRef!: ElementRef;
  @ViewChild('sidebar') sidebarRef!: ElementRef;
  @ViewChild('tabs') tabsRef!: ElementRef;

  private route = inject(ActivatedRoute);
  private fileSvc = inject(FileService);
  private collabSvc = inject(CollabService);
  private execSvc = inject(ExecutionService);
  private versionSvc = inject(VersionService);
  private commentSvc = inject(CommentService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  projectId!: number;
  projectName = 'Project';
  files: CodeFile[] = [];
  activeFile: CodeFile | null = null;
  editorContent = '';
  unsaved = false;
  running = false;
  execPanelOpen = true;
  stdin = '';
  currentJob: ExecutionJob | null = null;
  rightPanelMode: 'comments' | 'versions' | null = null;
  showNewFileDialog = false;
  comments: any[] = [];
  snapshots: any[] = [];
  newComment = '';
  remoteCursors = new Map<string, CursorPosition>();

  private subs: Subscription[] = [];
  private changeTimer: any;
  private sessionId: string | null = null;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.fileSvc.getTree(this.projectId).subscribe(files => {
      this.files = files.filter(f => !f.deleted && f.fileType === 'FILE');
      if (this.files.length) this.openFile(this.files[0]);
    });
  }

  ngAfterViewInit(): void {
    gsap.fromTo(this.sidebarRef.nativeElement,
      { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(this.tabsRef.nativeElement,
      { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.2 });
  }

  openFile(file: CodeFile): void {
    this.activeFile = file;
    this.fileSvc.getContent(file.fileId).subscribe(r => {
      this.editorContent = r.content;
      this.unsaved = false;
    });
    this.commentSvc.getByFile(file.fileId).subscribe(c => this.comments = c);
  }

  onContentChange(): void {
    this.unsaved = true;
    // Debounced collab broadcast
    clearTimeout(this.changeTimer);
    this.changeTimer = setTimeout(() => {
      if (this.sessionId) {
        this.collabSvc.sendEditDelta(this.sessionId, { content: this.editorContent });
      }
    }, 200);
  }

  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this.save(); }
  }

  save(): void {
    if (!this.activeFile) return;
    this.fileSvc.updateContent(this.activeFile.fileId, this.editorContent).subscribe(() => {
      this.unsaved = false;
      this.toast.success('Saved!');
    });
  }

  runCode(): void {
    if (!this.activeFile) return;
    this.running = true;
    this.execPanelOpen = true;

    this.execSvc.submit({
      projectId: this.projectId,
      fileId: this.activeFile.fileId,
      language: this.activeFile.language,
      sourceCode: this.editorContent,
      stdin: this.stdin
    }).subscribe({
      next: job => {
        this.currentJob = job;
        this.pollJobStatus(job.jobId);
      },
      error: () => { this.running = false; this.toast.error('Execution failed to start.'); }
    });
  }

  private pollJobStatus(jobId: string): void {
    const interval = setInterval(() => {
      this.execSvc.getJob(jobId).subscribe(job => {
        this.currentJob = job;
        if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
          clearInterval(interval);
          this.running = false;
        }
      });
    }, 1000);
  }

  getOutput(): string {
    if (!this.currentJob) return '';
    return this.currentJob.stdout || this.currentJob.stderr || '(no output)';
  }

  toggleCollab(): void {
    if (this.sessionId) {
      this.collabSvc.sendLeave(this.sessionId);
      this.collabSvc.disconnectFromSession();
      this.sessionId = null;
      this.toast.info('Left collab session');
      return;
    }
    if (!this.activeFile) return;
    this.collabSvc.createSession({
      projectId: this.projectId,
      fileId: this.activeFile.fileId,
      language: this.activeFile.language,
      maxParticipants: 10,
      passwordProtected: false
    }).subscribe(({ sessionId }) => {
      this.sessionId = sessionId;
      this.collabSvc.connectToSession(sessionId);
      this.subs.push(
        this.collabSvc.editDelta$.subscribe(delta => {
          // Apply remote delta (in real impl, use Monaco model applyEdit)
          console.log('Remote delta', delta);
        }),
        this.collabSvc.cursorPos$.subscribe(pos => {
          this.remoteCursors.set(`${pos.userId}`, pos);
        })
      );
      this.toast.success(`Collab session started: ${sessionId}`);
    });
  }

  toggleVersions(): void {
    if (this.rightPanelMode === 'versions') { this.rightPanelMode = null; return; }
    this.rightPanelMode = 'versions';
    if (this.activeFile) {
      this.versionSvc.getHistory(this.activeFile.fileId).subscribe(s => this.snapshots = s);
    }
  }

  createSnapshot(): void {
    if (!this.activeFile) return;
    const message = prompt('Snapshot message:') || 'Quick save';
    this.versionSvc.createSnapshot({
      projectId: this.projectId,
      fileId: this.activeFile.fileId,
      message,
      content: this.editorContent,
      branch: 'main'
    }).subscribe(() => this.toast.success('Snapshot created!'));
  }

  restoreSnapshot(id: number): void {
    this.versionSvc.restore(id).subscribe(snap => {
      this.editorContent = snap.content;
      this.unsaved = true;
      this.toast.success('Snapshot restored!');
    });
  }

  addComment(): void {
    if (!this.activeFile || !this.newComment.trim()) return;
    this.commentSvc.add({
      projectId: this.projectId,
      fileId: this.activeFile.fileId,
      content: this.newComment,
      lineNumber: 1
    }).subscribe(c => {
      this.comments = [...this.comments, c];
      this.newComment = '';
    });
  }

  resolveComment(id: number): void {
    this.commentSvc.resolve(id).subscribe(c => {
      this.comments = this.comments.map(x => x.id === id ? c : x);
    });
  }

  getFileIcon(lang: string): string {
    const icons: Record<string, string> = {
      java: '☕', python: '🐍', javascript: '🟨', typescript: '🔷',
      go: '🐹', rust: '🦀', cpp: '⚙️', c: '⚙️', html: '🌐', css: '🎨'
    };
    return icons[lang?.toLowerCase()] || '📄';
  }

  getCursorTop(line: number): string { return `${line * 20}px`; }
  getCursorLeft(col: number): string { return `${col * 8.4}px`; }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.sessionId) this.collabSvc.disconnectFromSession();
  }
}

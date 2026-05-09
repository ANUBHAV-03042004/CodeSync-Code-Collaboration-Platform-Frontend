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
      <!-- Sidebar: File Tree -->
      <aside class="nb-sidebar" #sidebar>
        <div class="sidebar-header">
          <span class="p-name">{{ projectName }}</span>
          <button class="nb-icon-btn plus" (click)="showNewFileDialog = true" title="New file">+</button>
        </div>
        <div class="file-scroller">
          <div class="file-node"
               *ngFor="let f of files"
               [class.active]="f.fileId === activeFile?.fileId"
               (click)="openFile(f)">
            <span class="f-icon">{{ getFileIcon(f.language) }}</span>
            <span class="f-name">{{ f.name }}</span>
            <div class="active-indicator" *ngIf="f.fileId === activeFile?.fileId"></div>
          </div>
        </div>
        <div class="sidebar-footer">
           <button class="nb-btn-sm btn-yellow w-full" (click)="toggleCollab()">
             {{ sessionId ? '🔴 LEAVE COLLAB' : '👥 START COLLAB' }}
           </button>
        </div>
      </aside>

      <!-- Main Editor -->
      <main class="nb-main">
        <!-- Toolbar / Tabs -->
        <div class="nb-toolbar" #tabs>
          <div class="nb-tabs">
            <div class="nb-tab" *ngIf="activeFile" [style.border-bottom-color]="getLangColor(activeFile.language)">
              <span class="f-icon">{{ getFileIcon(activeFile.language) }}</span>
              <span>{{ activeFile.name }}</span>
              <span class="unsaved-mark" *ngIf="unsaved">●</span>
            </div>
          </div>

          <div class="toolbar-actions">
            <button class="nb-action-btn" (click)="save()" [disabled]="!unsaved" title="Save">💾</button>
            <button class="nb-action-btn run" (click)="runCode()" [disabled]="running" title="Run">▶</button>
            <button class="nb-action-btn" (click)="createSnapshot()" title="Snapshot">📸</button>
            <button class="nb-action-btn" (click)="toggleVersions()" [class.active]="rightPanelMode === 'versions'" title="History">🕒</button>
            <button class="nb-action-btn" (click)="rightPanelMode = 'comments'" [class.active]="rightPanelMode === 'comments'" title="Comments">💬</button>
          </div>
        </div>

        <div class="editor-body">
          <!-- Monaco Placeholder -->
          <div class="editor-container" #monacoContainer>
             <textarea class="nb-textarea"
                       [(ngModel)]="editorContent"
                       (input)="onContentChange()"
                       (keydown)="onKeydown($event)"
                       placeholder="Select a file to start coding..."
                       [spellcheck]="false"></textarea>

             <!-- Remote Cursors -->
             <div class="cursor-layer" *ngIf="sessionId">
                <div class="remote-cursor" *ngFor="let cursor of remoteCursors | keyvalue"
                     [style.top]="getCursorTop(cursor.value.line)"
                     [style.left]="getCursorLeft(cursor.value.col)">
                  <div class="cursor-bar"></div>
                  <div class="cursor-label">User {{ cursor.key }}</div>
                </div>
             </div>
          </div>

          <!-- Bottom Panel: Console -->
          <div class="nb-console" [class.collapsed]="!execPanelOpen">
            <div class="console-header" (click)="execPanelOpen = !execPanelOpen">
              <div class="flex items-center gap-12">
                <span class="terminal-icon">$_</span>
                <span class="label">CONSOLE</span>
              </div>
              <div class="flex items-center gap-12">
                <span class="status-chip" [class]="currentJob?.status?.toLowerCase() || ''">
                  {{ currentJob?.status || 'IDLE' }}
                </span>
                <span class="toggle-icon">{{ execPanelOpen ? '▼' : '▲' }}</span>
              </div>
            </div>
            <div class="console-body" *ngIf="execPanelOpen">
              <div class="input-row">
                <div class="prompt">></div>
                <input [(ngModel)]="stdin" placeholder="Enter standard input..." class="console-input" (keydown.enter)="runCode()" />
                <button (click)="runCode()" [disabled]="running" class="nb-btn-sm btn-green">
                   {{ running ? 'EXECUTING...' : 'RUN' }}
                </button>
              </div>
              <div class="output-area">
                <pre *ngIf="currentJob">{{ getOutput() }}</pre>
                <div class="placeholder" *ngIf="!currentJob">Program output will appear here.</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Panel -->
      <aside class="nb-right-panel" *ngIf="rightPanelMode" #rightPanel>
        <div class="rp-header">
          <span class="label">{{ rightPanelMode === 'comments' ? 'COMMENTS' : 'SNAPSHOTS' }}</span>
          <button class="close-btn" (click)="rightPanelMode = null">✕</button>
        </div>

        <div class="rp-content">
          <!-- Comments Mode -->
          <div class="comment-scroller" *ngIf="rightPanelMode === 'comments'">
            <div class="nb-comment-card" *ngFor="let c of comments">
              <div class="c-meta">
                <span class="c-user">User #{{ c.authorId }}</span>
                <span class="c-line">L{{ c.lineNumber }}</span>
                <button class="c-resolve" (click)="resolveComment(c.id)" *ngIf="!c.resolved">DONE</button>
              </div>
              <div class="c-text" [class.resolved]="c.resolved">{{ c.content }}</div>
            </div>
            <div class="comment-input-box">
              <textarea [(ngModel)]="newComment" placeholder="Write a comment..." class="nb-textarea-sm"></textarea>
              <button (click)="addComment()" class="nb-btn-sm btn-blue w-full mt-8">POST COMMENT</button>
            </div>
          </div>

          <!-- Version History Mode -->
          <div class="version-scroller" *ngIf="rightPanelMode === 'versions'">
            <div class="nb-version-card" *ngFor="let snap of snapshots">
              <div class="v-header">
                <span class="v-msg">{{ snap.message }}</span>
                <span class="v-tag">{{ snap.branch }}</span>
              </div>
              <div class="v-meta">v{{ snap.version }} · {{ snap.createdAt | date:'shortTime' }}</div>
              <button class="nb-btn-sm btn-white w-full mt-8" (click)="restoreSnapshot(snap.id)">RESTORE</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .editor-shell { display: flex; height: 100vh; background: var(--W); color: var(--K); overflow: hidden; font-family: 'Space Grotesk', sans-serif; }

    /* ── Sidebar ── */
    .nb-sidebar { width: 260px; border-right: 4px solid var(--K); background: var(--O); display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar-header { padding: 20px; border-bottom: 4px solid var(--K); display: flex; align-items: center; justify-content: space-between; background: var(--Y); }
    .p-name { font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; overflow: hidden; text-overflow: ellipsis; }
    .plus { width: 28px; height: 28px; background: var(--W); border: 2px solid var(--K); font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 var(--K); }

    .file-scroller { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .file-node { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; font-weight: 600; font-size: 13px; position: relative; border: 2px solid transparent; transition: all .1s; }
    .file-node:hover { background: rgba(0,0,0,0.05); }
    .file-node.active { background: var(--W); border-color: var(--K); box-shadow: 3px 3px 0 var(--K); }
    .active-indicator { position: absolute; left: 0; top: 10px; bottom: 10px; width: 4px; background: var(--B); border-radius: 0 4px 4px 0; }
    .sidebar-footer { padding: 16px; border-top: 4px solid var(--K); }

    /* ── Main ── */
    .nb-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .nb-toolbar { height: 60px; display: flex; align-items: center; border-bottom: 4px solid var(--K); background: var(--W); padding: 0 16px; justify-content: space-between; }
    .nb-tabs { display: flex; height: 100%; align-items: flex-end; }
    .nb-tab { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: 3px solid var(--K); border-bottom: 6px solid var(--B); background: var(--O); font-weight: 700; font-size: 13px; transform: translateY(4px); }

    .toolbar-actions { display: flex; gap: 8px; }
    .nb-action-btn { width: 36px; height: 36px; border: 3px solid var(--K); background: var(--W); cursor: pointer; box-shadow: 3px 3px 0 var(--K); display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all .1s; }
    .nb-action-btn:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 var(--K); }
    .nb-action-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; transform: none; }
    .nb-action-btn.run { background: var(--G); }
    .nb-action-btn.active { background: var(--B); color: #fff; }

    .editor-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .editor-container { flex: 1; background: #fff; position: relative; }
    .nb-textarea { width: 100%; height: 100%; border: none; padding: 24px; font-family: 'JetBrains Mono', monospace; font-size: 15px; line-height: 1.6; color: #1a1a1a; outline: none; resize: none; background: #fafafa; }

    /* ── Console ── */
    .nb-console { border-top: 4px solid var(--K); background: var(--W); transition: height .2s; }
    .nb-console.collapsed { height: 48px; }
    .console-header { height: 48px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: var(--K); color: #fff; }
    .terminal-icon { font-family: monospace; font-weight: 800; color: var(--G); }
    .console-header .label { font-weight: 800; font-size: 12px; letter-spacing: 1px; }
    .status-chip { font-size: 9px; font-weight: 800; padding: 2px 8px; border: 1px solid #444; border-radius: 100px; text-transform: uppercase; }
    .status-chip.running { background: var(--Y); color: var(--K); }
    .status-chip.completed { background: var(--G); color: #fff; }

    .console-body { padding: 16px; background: var(--O); height: 260px; display: flex; flex-direction: column; gap: 12px; }
    .input-row { display: flex; align-items: center; gap: 10px; border: 3px solid var(--K); background: var(--W); padding: 4px 8px; box-shadow: 4px 4px 0 var(--K); }
    .prompt { font-family: monospace; font-weight: 800; color: var(--B); }
    .console-input { flex: 1; border: none; outline: none; font-family: 'JetBrains Mono', monospace; font-size: 14px; background: transparent; }
    .output-area { flex: 1; border: 3px solid var(--K); background: #000; color: var(--G); padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 13px; overflow-y: auto; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
    .output-area pre { margin: 0; white-space: pre-wrap; }
    .output-area .placeholder { color: #555; font-style: italic; }

    /* ── Right Panel ── */
    .nb-right-panel { width: 320px; border-left: 4px solid var(--K); background: var(--W); display: flex; flex-direction: column; flex-shrink: 0; }
    .rp-header { padding: 20px; border-bottom: 4px solid var(--K); background: var(--B); color: #fff; display: flex; align-items: center; justify-content: space-between; }
    .rp-header .label { font-weight: 800; font-size: 14px; letter-spacing: 1px; }
    .close-btn { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }

    .rp-content { flex: 1; overflow-y: auto; padding: 16px; background: var(--O); }
    .nb-comment-card, .nb-version-card { border: 3px solid var(--K); background: var(--W); padding: 16px; margin-bottom: 12px; box-shadow: 4px 4px 0 var(--K); }
    .c-meta, .v-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .c-user { font-weight: 800; font-size: 11px; color: var(--B); }
    .c-line { font-size: 10px; font-weight: 800; color: #888; }
    .c-resolve { font-size: 9px; font-weight: 800; border: 1px solid var(--K); padding: 1px 6px; cursor: pointer; }
    .c-text { font-size: 13px; color: #333; line-height: 1.5; }
    .c-text.resolved { text-decoration: line-through; opacity: 0.5; }

    .nb-textarea-sm { width: 100%; border: 3px solid var(--K); padding: 10px; font-family: inherit; font-size: 13px; box-sizing: border-box; resize: vertical; }

    .nb-btn-sm { border: 2px solid var(--K); padding: 6px 12px; font-weight: 800; font-size: 11px; cursor: pointer; box-shadow: 2px 2px 0 var(--K); text-transform: uppercase; }
    .btn-blue { background: var(--B); color: #fff; }
    .btn-green { background: var(--G); color: #fff; }
    .btn-yellow { background: var(--Y); color: var(--K); }
    .btn-white { background: var(--W); color: var(--K); }
    .w-full { width: 100%; }
    .mt-8 { margin-top: 8px; }

    /* ── Utils ── */
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-12 { gap: 12px; }

    /* ── Cursors ── */
    .remote-cursor { position: absolute; pointer-events: none; }
    .cursor-bar { width: 2px; height: 20px; background: var(--Y); }
    .cursor-label { position: absolute; top: -18px; left: 0; background: var(--Y); color: var(--K); font-size: 10px; font-weight: 800; padding: 1px 6px; white-space: nowrap; border: 1px solid var(--K); }
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
    if (this.sidebarRef?.nativeElement) {
      gsap.fromTo(this.sidebarRef.nativeElement,
        { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
    if (this.tabsRef?.nativeElement) {
      gsap.fromTo(this.tabsRef.nativeElement,
        { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.2 });
    }
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

  getLangColor(lang: string): string {
    const m: Record<string, string> = {
      java: '#FFD600', python: '#1A6FFF', javascript: '#FFD600',
      typescript: '#1A6FFF', cpp: '#FF2D2D', go: '#00C853'
    };
    return m[lang?.toLowerCase()] || '#DDD';
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.sessionId) this.collabSvc.disconnectFromSession();
  }
}

import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';
import { FileService } from '../../services/file.service';
import { CollabService } from '../../services/collab.service';
import { ExecutionService, VersionService, CommentService } from '../../services/other-services';
import { AuthService } from '../../services/auth.service';
import { CodeFile, ExecutionJob, CursorPosition, Snapshot, Comment } from '../../core/models';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="editor-shell" #shell>
      <!-- Sidebar: File Tree -->
      <aside class="nb-sidebar" #sidebar>
        <div class="brand-box" routerLink="/dashboard" style="cursor:pointer">
          <div class="nb-bolt">⚡</div>
          <span class="nb-name">YOURS<span class="nb-name-accent">CODE</span></span>
        </div>
        <div class="sidebar-header">
          <span class="p-name" [title]="projectName">{{ projectName }}</span>
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
          <div class="empty-files" *ngIf="!files.length && !loading">
            <p>No files yet.</p>
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
            <button class="nb-action-btn" (click)="save()" [disabled]="!unsaved || !activeFile" title="Save">💾</button>
            <button class="nb-action-btn run" (click)="runCode()" [disabled]="running || !activeFile" title="Run">▶</button>
            <button class="nb-action-btn" (click)="createSnapshot()" [disabled]="!activeFile" title="Snapshot">📸</button>
            <button class="nb-action-btn" (click)="toggleVersions()" [class.active]="rightPanelMode === 'versions'" [disabled]="!activeFile" title="History">🕒</button>
            <button class="nb-action-btn" (click)="toggleComments()" [class.active]="rightPanelMode === 'comments'" [disabled]="!activeFile" title="Comments">💬</button>
          </div>
        </div>

        <div class="editor-body">
          <!-- Monaco Placeholder -->
          <div class="editor-container">
             <textarea class="nb-textarea"
                       [(ngModel)]="editorContent"
                       (input)="onContentChange()"
                       (keydown)="onKeydown($event)"
                       [placeholder]="activeFile ? 'Start coding...' : 'Select a file to start coding...'"
                       [disabled]="!activeFile"
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
                <span class="label">TERMINAL / CONSOLE</span>
              </div>
              <div class="flex items-center gap-12">
                <span class="status-chip" [class]="currentJob?.status?.toLowerCase() || ''">
                  {{ currentJob?.status || 'READY' }}
                </span>
                <span class="toggle-icon">{{ execPanelOpen ? '▼' : '▲' }}</span>
              </div>
            </div>
            <div class="console-body" *ngIf="execPanelOpen">
              <div class="input-row">
                <div class="prompt">guest&#64;yourscode:~$</div>
                <input [(ngModel)]="stdin" placeholder="provide stdin here..." class="console-input" (keydown.enter)="runCode()" />
                <button (click)="runCode()" [disabled]="running || !activeFile" class="nb-btn-sm btn-green run-btn">
                   {{ running ? 'EXECUTING...' : 'RUN CODE' }}
                </button>
              </div>
              <div class="output-area">
                <div class="output-hdr" *ngIf="currentJob">
                  <span>EXIT CODE: {{ currentJob.exitCode }}</span>
                  <span>TIME: {{ currentJob.executionTimeMs }}ms</span>
                </div>
                <pre *ngIf="currentJob" [class.error-out]="currentJob.stderr">{{ getOutput() }}</pre>
                <div class="placeholder" *ngIf="!currentJob">
                  <p>// Execution output will appear here</p>
                  <p>// Click RUN to start the process</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Panel -->
      <aside class="nb-right-panel" *ngIf="rightPanelMode" #rightPanel>
        <div class="rp-header" [class.bg-B]="rightPanelMode === 'comments'" [class.bg-Y]="rightPanelMode === 'versions'">
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
              <button (click)="addComment()" [disabled]="!newComment.trim()" class="nb-btn-sm btn-blue w-full mt-8">POST COMMENT</button>
            </div>
            <div class="empty-hint" *ngIf="!comments.length">No comments yet.</div>
          </div>

          <!-- Version History Mode -->
          <div class="version-scroller" *ngIf="rightPanelMode === 'versions'">
            <div class="nb-version-card" *ngFor="let snap of snapshots">
              <div class="v-header">
                <span class="v-msg">{{ snap.message }}</span>
                <span class="v-tag">{{ snap.branch }}</span>
              </div>
              <div class="v-meta">v{{ snap.version }} · {{ snap.createdAt | date:'MMM d, HH:mm' }}</div>
              <button class="nb-btn-sm btn-white w-full mt-8" (click)="restoreSnapshot(snap.id)">RESTORE</button>
            </div>
            <div class="empty-hint" *ngIf="!snapshots.length">No snapshots found.</div>
          </div>
        </div>
      </aside>

      <!-- New File Modal -->
      <div class="nb-modal-overlay" *ngIf="showNewFileDialog">
        <div class="nb-modal">
          <div class="modal-hdr">NEW FILE</div>
          <div class="modal-body">
            <input [(ngModel)]="newFileName" placeholder="filename.js" class="nb-input w-full" (keydown.enter)="createFile()" #newFileInput />
            <div class="modal-actions mt-16">
              <button class="nb-btn-sm btn-white" (click)="showNewFileDialog = false">CANCEL</button>
              <button class="nb-btn-sm btn-yellow" (click)="createFile()">CREATE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editor-shell { display: flex; height: 100vh; background: var(--W); color: var(--K); overflow: hidden; font-family: 'Space Grotesk', sans-serif; position: relative; }
    .nb-sidebar { width: 280px; border-right: 4px solid var(--K); background: var(--O); display: flex; flex-direction: column; flex-shrink: 0; }
    .brand-box { height: 60px; background: var(--K); display: flex; align-items: center; padding: 0 20px; gap: 10px; border-bottom: 4px solid var(--Y); }
    .nb-bolt { width: 30px; height: 30px; background: var(--Y); border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; }
    .nb-name { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--W); letter-spacing: 1px; }
    .nb-name-accent { color: var(--Y); }

    .sidebar-header { padding: 18px 20px; border-bottom: 4px solid var(--K); display: flex; align-items: center; justify-content: space-between; background: var(--Y); }
    .p-name { font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; overflow: hidden; text-overflow: ellipsis; color: var(--K); white-space: nowrap; max-width: 180px; }
    .plus { width: 32px; height: 32px; background: var(--W); border: 3px solid var(--K); font-weight: 800; cursor: pointer; box-shadow: 3px 3px 0 var(--K); display: flex; align-items: center; justify-content: center; font-size: 18px; }
    
    .file-scroller { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .file-node { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; font-weight: 700; font-size: 14px; position: relative; border: 3px solid transparent; transition: all .15s; }
    .file-node:hover { background: rgba(0,0,0,0.06); }
    .file-node.active { background: var(--W); border-color: var(--K); box-shadow: 4px 4px 0 var(--K); }
    .active-indicator { position: absolute; left: 0; top: 12px; bottom: 12px; width: 4px; background: var(--B); }
    .sidebar-footer { padding: 20px; border-top: 4px solid var(--K); background: var(--W); }

    .nb-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .nb-toolbar { height: 60px; display: flex; align-items: center; border-bottom: 4px solid var(--K); background: var(--W); padding: 0 20px; justify-content: space-between; z-index: 10; }
    .nb-tabs { display: flex; height: 100%; align-items: flex-end; gap: 8px; }
    .nb-tab { display: flex; align-items: center; gap: 10px; padding: 10px 24px; border: 4px solid var(--K); border-bottom: none; background: var(--O); font-weight: 800; font-size: 14px; transform: translateY(4px); }

    .toolbar-actions { display: flex; gap: 12px; }
    .nb-action-btn { width: 42px; height: 42px; border: 4px solid var(--K); background: var(--W); cursor: pointer; box-shadow: 4px 4px 0 var(--K); display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all .1s; }
    .nb-action-btn:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--K); }
    .nb-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .nb-action-btn.run { background: var(--G); }
    .nb-action-btn.active { background: var(--K); color: #fff; }

    .editor-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .editor-container { flex: 1; background: #fff; position: relative; }
    .nb-textarea { width: 100%; height: 100%; border: none; padding: 32px; font-family: 'JetBrains Mono', monospace; font-size: 16px; line-height: 1.6; color: #1a1a1a; outline: none; resize: none; background: #fafafa; }

    .nb-console { border-top: 4px solid var(--K); background: var(--W); transition: height .2s; }
    .nb-console.collapsed { height: 56px; }
    .console-header { height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: var(--K); color: #fff; }
    .terminal-icon { font-family: 'JetBrains Mono', monospace; font-weight: 900; color: var(--G); font-size: 18px; }
    .console-header .label { font-weight: 900; font-size: 13px; letter-spacing: 2px; }
    .status-chip { font-size: 10px; font-weight: 900; padding: 3px 10px; border: 2px solid #444; text-transform: uppercase; }
    .status-chip.running { background: var(--Y); color: var(--K); }
    .status-chip.completed { background: var(--G); color: #fff; }

    .console-body { padding: 20px; background: #0A0A0A; height: 320px; display: flex; flex-direction: column; gap: 16px; }
    .input-row { display: flex; align-items: center; gap: 12px; border: 4px solid var(--W); background: #111; padding: 6px 12px; }
    .prompt { font-family: 'JetBrains Mono', monospace; color: var(--G); font-size: 13px; }
    .console-input { flex: 1; border: none; outline: none; background: transparent; color: #fff; font-family: 'JetBrains Mono', monospace; }
    .output-area { flex: 1; border: 4px solid #333; background: #000; color: #eee; padding: 16px; font-family: 'JetBrains Mono', monospace; overflow-y: auto; }
    .output-hdr { display: flex; gap: 24px; font-size: 11px; color: #666; margin-bottom: 12px; border-bottom: 1px solid #222; padding-bottom: 8px; }
    .output-area pre { margin: 0; white-space: pre-wrap; line-height: 1.5; }
    .error-out { color: var(--R); }

    .nb-right-panel { width: 360px; border-left: 4px solid var(--K); background: var(--W); display: flex; flex-direction: column; flex-shrink: 0; }
    .rp-header { padding: 24px; border-bottom: 4px solid var(--K); color: #fff; display: flex; align-items: center; justify-content: space-between; }
    .bg-B { background: var(--B); }
    .bg-Y { background: var(--Y); color: var(--K); }
    .rp-header .label { font-weight: 900; font-size: 16px; letter-spacing: 2px; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: inherit; }

    .rp-content { flex: 1; overflow-y: auto; padding: 20px; background: var(--O); }
    .nb-comment-card, .nb-version-card { border: 4px solid var(--K); background: var(--W); padding: 20px; margin-bottom: 16px; box-shadow: 6px 6px 0 var(--K); }
    .c-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .c-user { font-weight: 900; font-size: 12px; color: var(--B); }
    .c-line { font-size: 11px; font-weight: 900; background: var(--O); padding: 2px 6px; }
    .c-resolve { font-size: 10px; font-weight: 900; border: 2px solid var(--K); padding: 2px 8px; cursor: pointer; background: var(--Y); }
    .c-text { font-size: 14px; color: #1a1a1a; line-height: 1.5; }
    .c-text.resolved { text-decoration: line-through; opacity: 0.4; }

    .nb-textarea-sm { width: 100%; border: 4px solid var(--K); padding: 12px; font-family: inherit; resize: vertical; outline: none; }
    .nb-btn-sm { border: 3px solid var(--K); padding: 8px 16px; font-weight: 800; cursor: pointer; box-shadow: 4px 4px 0 var(--K); text-transform: uppercase; }
    .btn-blue { background: var(--B); color: #fff; }
    .btn-green { background: var(--G); color: #fff; }
    .btn-yellow { background: var(--Y); color: var(--K); }
    .btn-white { background: var(--W); color: var(--K); }
    .w-full { width: 100%; }
    .mt-8 { margin-top: 8px; }
    .empty-hint { text-align: center; color: #888; font-style: italic; margin-top: 40px; }

    .nb-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .nb-modal { background: var(--W); border: 4px solid var(--K); box-shadow: 12px 12px 0 var(--K); width: 400px; padding: 24px; }
    .modal-hdr { font-weight: 900; font-size: 18px; margin-bottom: 20px; }
    .nb-input { border: 3px solid var(--K); padding: 12px; width: 100%; outline: none; box-shadow: 3px 3px 0 var(--K); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; }

    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-12 { gap: 12px; }
    .mt-16 { margin-top: 16px; }
  `]
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('shell') shellRef!: ElementRef;
  @ViewChild('sidebar') sidebarRef!: ElementRef;
  @ViewChild('tabs') tabsRef!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fileSvc = inject(FileService);
  private collabSvc = inject(CollabService);
  private execSvc = inject(ExecutionService);
  private versionSvc = inject(VersionService);
  private commentSvc = inject(CommentService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);

  projectId!: number;
  projectName = 'Loading...';
  files: CodeFile[] = [];
  activeFile: CodeFile | null = null;
  editorContent = '';
  unsaved = false;
  running = false;
  execPanelOpen = false;
  loading = true;
  stdin = '';
  currentJob: ExecutionJob | null = null;
  rightPanelMode: 'comments' | 'versions' | null = null;
  showNewFileDialog = false;
  comments: Comment[] = [];
  snapshots: Snapshot[] = [];
  newComment = '';
  newFileName = '';
  remoteCursors = new Map<string, CursorPosition>();

  private subs: Subscription[] = [];
  private changeTimer: any;
  public sessionId: string | null = null;

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('projectId');
    this.projectId = Number(rawId);
    if (isNaN(this.projectId)) {
      this.toast.error('Invalid Project ID');
      this.router.navigate(['/projects']);
      return;
    }
    this.loadFiles();
    // In a real app, fetch project name here
    this.projectName = `Project #${this.projectId}`;
  }

  loadFiles(): void {
    this.loading = true;
    this.fileSvc.getTree(this.projectId).subscribe({
      next: files => {
        this.files = files.filter(f => !f.deleted && f.fileType === 'FILE');
        if (this.files.length && !this.activeFile) this.openFile(this.files[0]);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load files');
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sidebarRef?.nativeElement) {
        gsap.fromTo(this.sidebarRef.nativeElement, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 });
      }
    }, 100);
  }

  openFile(file: CodeFile): void {
    this.activeFile = file;
    this.fileSvc.getContent(file.fileId).subscribe({
      next: r => {
        this.editorContent = r.content;
        this.unsaved = false;
      },
      error: (err) => {
        console.error('Content load error', err);
        this.toast.error('Could not load file content');
      }
    });
    // Load side data
    if (this.rightPanelMode === 'comments') this.loadComments();
    if (this.rightPanelMode === 'versions') this.loadHistory();
  }

  createFile(): void {
    if (!this.newFileName.trim()) return;
    this.fileSvc.createFile({
      projectId: this.projectId,
      name: this.newFileName,
      path: this.newFileName,
      language: this.detectLanguage(this.newFileName),
      content: ''
    }).subscribe({
      next: (f) => {
        this.toast.success('File created!');
        this.showNewFileDialog = false;
        this.newFileName = '';
        this.loadFiles();
        this.openFile(f);
      },
      error: (err) => {
        console.error('File create error', err);
        this.toast.error(err.status === 400 ? 'File already exists or invalid name' : 'Failed to create file');
      }
    });
  }

  private detectLanguage(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    const map: Record<string,string> = { js:'JavaScript', ts:'TypeScript', py:'Python', go:'Go', java:'Java', cpp:'C++', rb:'Ruby', rs:'Rust' };
    return map[ext!] || 'Text';
  }

  onContentChange(): void {
    this.unsaved = true;
    if (this.sessionId) {
      clearTimeout(this.changeTimer);
      this.changeTimer = setTimeout(() => {
        this.collabSvc.sendEditDelta(this.sessionId!, { content: this.editorContent });
      }, 300);
    }
  }

  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this.save(); }
  }

  save(): void {
    if (!this.activeFile) return;
    this.fileSvc.updateContent(this.activeFile.fileId, this.editorContent).subscribe({
      next: () => {
        this.unsaved = false;
        this.toast.success('File saved!');
      },
      error: () => this.toast.error('Failed to save changes')
    });
  }

  runCode(): void {
    if (!this.activeFile) return;
    this.running = true;
    this.execPanelOpen = true;
    this.currentJob = null;

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
      error: () => {
        this.running = false;
        this.toast.error('Execution failed to start');
      }
    });
  }

  private pollJobStatus(jobId: string): void {
    const itv = setInterval(() => {
      this.execSvc.getJob(jobId).subscribe(job => {
        this.currentJob = job;
        if (['COMPLETED','FAILED','CANCELLED'].includes(job.status)) {
          clearInterval(itv);
          this.running = false;
        }
      });
    }, 1000);
  }

  getOutput(): string {
    if (!this.currentJob) return '';
    return (this.currentJob.stdout || '') + (this.currentJob.stderr || '');
  }

  toggleComments(): void {
    if (this.rightPanelMode === 'comments') { this.rightPanelMode = null; return; }
    this.rightPanelMode = 'comments';
    this.loadComments();
  }

  loadComments(): void {
    if (!this.activeFile) return;
    this.commentSvc.getByFile(this.activeFile.fileId).subscribe(c => this.comments = c);
  }

  toggleVersions(): void {
    if (this.rightPanelMode === 'versions') { this.rightPanelMode = null; return; }
    this.rightPanelMode = 'versions';
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.activeFile) return;
    this.versionSvc.getHistory(this.activeFile.fileId).subscribe(s => this.snapshots = s);
  }

  addComment(): void {
    if (!this.activeFile || !this.newComment.trim()) return;
    this.commentSvc.add({
      projectId: this.projectId,
      fileId: this.activeFile.fileId,
      content: this.newComment,
      lineNumber: 1
    }).subscribe({
      next: c => {
        this.comments = [...this.comments, c];
        this.newComment = '';
        this.toast.success('Comment added');
      },
      error: () => this.toast.error('Failed to post comment')
    });
  }

  resolveComment(id: number): void {
    this.commentSvc.resolve(id).subscribe(c => {
      this.comments = this.comments.map(x => x.id === id ? c : x);
    });
  }

  createSnapshot(): void {
    if (!this.activeFile) return;
    const msg = prompt('Enter snapshot message:');
    if (msg === null) return;
    this.versionSvc.createSnapshot({
      projectId: this.projectId,
      fileId: this.activeFile.fileId,
      message: msg || 'Manual Snapshot',
      content: this.editorContent,
      branch: 'main'
    }).subscribe({
      next: () => {
        this.toast.success('Snapshot created!');
        if (this.rightPanelMode === 'versions') this.loadHistory();
      },
      error: () => this.toast.error('Failed to save snapshot')
    });
  }

  restoreSnapshot(id: number): void {
    this.versionSvc.restore(id).subscribe(snap => {
      this.editorContent = snap.content;
      this.unsaved = true;
      this.toast.success('Restored snapshot content');
    });
  }

  toggleCollab(): void {
    if (this.sessionId) {
      this.collabSvc.sendLeave(this.sessionId);
      this.collabSvc.disconnectFromSession();
      this.sessionId = null;
      return;
    }
    if (!this.activeFile) return;
    this.collabSvc.createSession({
      projectId: this.projectId,
      fileId: this.activeFile.fileId,
      language: this.activeFile.language,
      maxParticipants: 5,
      passwordProtected: false
    }).subscribe(s => {
      this.sessionId = s.sessionId;
      this.collabSvc.connectToSession(s.sessionId);
      this.toast.success('Collaboration active');
    });
  }

  getFileIcon(lang: string): string {
    const map: Record<string,string> = { java:'☕', python:'🐍', javascript:'🟨', typescript:'🔷', go:'🐹', rust:'🦀' };
    return map[lang?.toLowerCase()] || '📄';
  }

  getLangColor(lang: string): string {
    const map: Record<string,string> = { java:'#FFD600', python:'#1A6FFF', javascript:'#FFD600', typescript:'#1A6FFF', go:'#00C853' };
    return map[lang?.toLowerCase()] || '#888';
  }

  getCursorTop(line: number): string { return `${line * 24}px`; }
  getCursorLeft(col: number): string { return `${col * 9.6}px`; }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.sessionId) this.collabSvc.disconnectFromSession();
  }
}

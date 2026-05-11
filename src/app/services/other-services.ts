import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { environment } from '../../environments/environment';
import {
  ExecutionJob, SubmitExecutionRequest,
  Snapshot, CreateSnapshotRequest,
  Comment, AddCommentRequest,
  Notification, BroadcastRequest
} from '../core/models';

// ── Execution Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ExecutionService {
  private http = inject(HttpClient);
  private ws = inject(WebSocketService);
  private base = `${environment.apiBase}/api/v1/executions`;

  jobResult$ = new Subject<ExecutionJob>();

  submit(req: SubmitExecutionRequest): Observable<ExecutionJob> {
    return this.http.post<ExecutionJob>(this.base, req);
  }

  getJob(jobId: string): Observable<ExecutionJob> {
    return this.http.get<ExecutionJob>(`${this.base}/${jobId}`);
  }

  getByUser(userId: number): Observable<ExecutionJob[]> {
    return this.http.get<ExecutionJob[]>(`${this.base}/user/${userId}`);
  }

  getByProject(projectId: number): Observable<ExecutionJob[]> {
    return this.http.get<ExecutionJob[]>(`${this.base}/project/${projectId}`);
  }

  cancel(jobId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${jobId}/cancel`, {});
  }

  getSupportedLanguages(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/languages`);
  }

  getStats(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.base}/stats`);
  }

  connectJobUpdates(): void {
    this.ws.connect('execution', environment.wsExecutionEndpoint);
    this.ws.subscribe('execution', '/user/queue/execution.result', msg => {
      this.jobResult$.next(JSON.parse(msg.body));
    });
  }
}

// ── Version Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class VersionService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/v1/versions`;

  createSnapshot(req: CreateSnapshotRequest): Observable<Snapshot> {
    return this.http.post<Snapshot>(this.base, req);
  }

  getById(id: number): Observable<Snapshot> {
    return this.http.get<Snapshot>(`${this.base}/${id}`);
  }

  getHistory(fileId: number): Observable<Snapshot[]> {
    return this.http.get<Snapshot[]>(`${this.base}/file/${fileId}/history`);
  }

  getLatest(fileId: number): Observable<Snapshot> {
    return this.http.get<Snapshot>(`${this.base}/file/${fileId}/latest`);
  }

  getByProject(projectId: number): Observable<Snapshot[]> {
    return this.http.get<Snapshot[]>(`${this.base}/project/${projectId}`);
  }

  getBranches(projectId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/project/${projectId}/branches`);
  }

  getByBranch(projectId: number, branch: string): Observable<Snapshot[]> {
    return this.http.get<Snapshot[]>(`${this.base}/project/${projectId}/branch/${branch}`);
  }

  diff(a: number, b: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/diff`, { params: { a: `${a}`, b: `${b}` } });
  }

  restore(id: number): Observable<Snapshot> {
    return this.http.post<Snapshot>(`${this.base}/${id}/restore`, {});
  }

  deleteSnapshot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  createBranch(fileId: number, branchName: string): Observable<Snapshot> {
    return this.http.post<Snapshot>(`${this.base}/branch`, { fileId, branchName });
  }

  tagSnapshot(id: number, tag: string): Observable<Snapshot> {
    return this.http.put<Snapshot>(`${this.base}/${id}/tag`, { tag });
  }
}

// ── Comment Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/v1/comments`;

  add(req: AddCommentRequest): Observable<Comment> {
    return this.http.post<Comment>(this.base, req);
  }

  getByFile(fileId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/file/${fileId}`);
  }

  getByProject(projectId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/project/${projectId}`);
  }

  getById(id: number): Observable<Comment> {
    return this.http.get<Comment>(`${this.base}/${id}`);
  }

  getReplies(id: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/${id}/replies`);
  }

  getByLine(fileId: number, line: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/file/${fileId}/line/${line}`);
  }

  getCount(fileId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/file/${fileId}/count`);
  }

  update(id: number, content: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.base}/${id}`, { content });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  resolve(id: number): Observable<Comment> {
    return this.http.put<Comment>(`${this.base}/${id}/resolve`, {});
  }

  unresolve(id: number): Observable<Comment> {
    return this.http.put<Comment>(`${this.base}/${id}/unresolve`, {});
  }
}

// ── Notification Service ──────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private ws = inject(WebSocketService);
  private base = `${environment.apiBase}/api/v1/notifications`;

  notification$ = new Subject<Notification>();
  unreadCount$ = new Subject<number>();

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.base);
  }

  getUnread(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/unread`);
  }

  getBadgeCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.base}/badge`);
  }

  markRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.put<void>(`${this.base}/read-all`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  deleteRead(): Observable<void> {
    return this.http.delete<void>(`${this.base}/read`);
  }

  broadcast(req: BroadcastRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/broadcast`, req);
  }

  connectPush(): void {
    // FIX: only connect if a valid token is present.
    // The navbar calls connectPush() on init. If the OAuth2 callback hasn't
    // finished storing the token yet, the STOMP connect and every HTTP call
    // fires without a Bearer header -> 403 Forbidden from the gateway.
    if (!localStorage.getItem('access_token')) return;
    this.ws.connect('notifications', environment.wsNotificationEndpoint);
    this.ws.subscribe('notifications', '/user/queue/notifications', msg => {
      const notif: Notification = JSON.parse(msg.body);
      this.notification$.next(notif);
      this.getBadgeCount().subscribe(r => this.unreadCount$.next(r.unreadCount));
    });
  }

  disconnectPush(): void {
    this.ws.disconnect('notifications');
  }
}

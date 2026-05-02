import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { environment } from '../../environments/environment';
import { CreateSessionRequest, EditDelta, CursorPosition } from '../core/models';

const WS_NAME = 'collab';

@Injectable({ providedIn: 'root' })
export class CollabService {
  private http = inject(HttpClient);
  private ws = inject(WebSocketService);
  private base = `${environment.apiBase}/api/v1/sessions`;

  editDelta$ = new Subject<EditDelta>();
  cursorPos$ = new Subject<CursorPosition>();
  sessionEvent$ = new Subject<any>();

  // ── REST ──────────────────────────────────────────────────────────────────
  createSession(req: CreateSessionRequest): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(this.base, req);
  }

  joinSession(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${sessionId}/join`, {});
  }

  leaveSession(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${sessionId}/leave`, {});
  }

  endSession(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${sessionId}/end`, {});
  }

  kickParticipant(sessionId: string, targetUserId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${sessionId}/kick/${targetUserId}`, {});
  }

  getParticipants(sessionId: string): Observable<Set<string>> {
    return this.http.get<Set<string>>(`${this.base}/${sessionId}/participants`);
  }

  isActive(sessionId: string): Observable<{ active: boolean }> {
    return this.http.get<{ active: boolean }>(`${this.base}/${sessionId}/active`);
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────
  connectToSession(sessionId: string): Subject<boolean> {
    const status$ = this.ws.connect(WS_NAME, environment.wsCollabEndpoint);

    // Subscribe to edit deltas
    this.ws.subscribe(WS_NAME, `/topic/session.${sessionId}.edit`, msg => {
      this.editDelta$.next(JSON.parse(msg.body));
    });

    // Subscribe to cursor positions
    this.ws.subscribe(WS_NAME, `/topic/session.${sessionId}.cursor`, msg => {
      this.cursorPos$.next(JSON.parse(msg.body));
    });

    // Subscribe to session events (join/leave/kick/end)
    this.ws.subscribe(WS_NAME, `/topic/session.${sessionId}.events`, msg => {
      this.sessionEvent$.next(JSON.parse(msg.body));
    });

    return status$;
  }

  sendEditDelta(sessionId: string, delta: any): void {
    this.ws.publish(WS_NAME, `/app/session.${sessionId}.edit`, delta);
  }

  sendCursorPosition(sessionId: string, line: number, col: number): void {
    this.ws.publish(WS_NAME, `/app/session.${sessionId}.cursor`, { line, col });
  }

  sendLeave(sessionId: string): void {
    this.ws.publish(WS_NAME, `/app/session.${sessionId}.leave`, {});
  }

  disconnectFromSession(): void {
    this.ws.disconnect(WS_NAME);
  }
}

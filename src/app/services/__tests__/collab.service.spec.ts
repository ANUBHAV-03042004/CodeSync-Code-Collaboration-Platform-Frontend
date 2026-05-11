import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CollabService } from '../collab.service';
import { WebSocketService } from '../websocket.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth.service';

const BASE = `${environment.apiBase}/api/v1/sessions`;

describe('CollabService', () => {
  let service: CollabService;
  let http: HttpTestingController;
  let wsSvc: jest.Mocked<Partial<WebSocketService>>;

  beforeEach(() => {
    wsSvc = {
      connect: jest.fn().mockReturnValue({ next: jest.fn(), subscribe: jest.fn() } as any),
      subscribe: jest.fn().mockReturnValue(null),
      publish: jest.fn(),
      disconnect: jest.fn()
    };

    const authSvc = {
      getCurrentUser: jest.fn().mockReturnValue({ userId: 123, username: 'testuser' })
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CollabService,
        { provide: WebSocketService, useValue: wsSvc },
        { provide: AuthService, useValue: authSvc }
      ]
    });
    service = TestBed.inject(CollabService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should create', () => expect(service).toBeTruthy());

  it('should POST createSession', () => {
    service.createSession({ projectId: 1, fileId: 1, language: 'Java', maxParticipants: 5, passwordProtected: false }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ sessionId: 'abc-123' });
  });

  it('should POST joinSession', () => {
    service.joinSession('abc-123').subscribe();
    const req = http.expectOne(`${BASE}/abc-123/join`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should POST leaveSession', () => {
    service.leaveSession('abc-123').subscribe();
    const req = http.expectOne(`${BASE}/abc-123/leave`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should DELETE endSession', () => {
    service.endSession('abc-123').subscribe();
    const req = http.expectOne(`${BASE}/abc-123`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST kickParticipant', () => {
    service.kickParticipant('abc-123', 99).subscribe();
    const req = http.expectOne(`${BASE}/abc-123/kick/99`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should GET participants', () => {
    service.getParticipants('abc-123').subscribe();
    const req = http.expectOne(`${BASE}/abc-123/participants`);
    expect(req.request.method).toBe('GET');
    req.flush(['user1', 'user2']);
  });

  it('should GET isActive', () => {
    service.isActive('abc-123').subscribe(r => expect(r.active).toBe(true));
    const req = http.expectOne(`${BASE}/abc-123/active`);
    req.flush({ active: true });
  });

  it('should call ws.connect on connectToSession', () => {
    service.connectToSession('abc-123');
    expect(wsSvc.connect).toHaveBeenCalledWith('collab', environment.wsCollabEndpoint);
  });

  it('should call ws.publish on sendEditDelta', () => {
    service.sendEditDelta('sess-1', { type: 'insert', text: 'x' });
    expect(wsSvc.publish).toHaveBeenCalledWith(
      'collab', 
      '/app/session.sess-1.edit', 
      { type: 'insert', text: 'x' },
      { 'X-User-Id': '123' }
    );
  });

  it('should call ws.publish on sendCursorPosition', () => {
    service.sendCursorPosition('sess-1', 10, 5);
    expect(wsSvc.publish).toHaveBeenCalledWith(
      'collab', 
      '/app/session.sess-1.cursor', 
      { line: 10, col: 5 },
      { 'X-User-Id': '123' }
    );
  });

  it('should call ws.disconnect on disconnectFromSession', () => {
    service.disconnectFromSession();
    expect(wsSvc.disconnect).toHaveBeenCalledWith('collab');
  });
});

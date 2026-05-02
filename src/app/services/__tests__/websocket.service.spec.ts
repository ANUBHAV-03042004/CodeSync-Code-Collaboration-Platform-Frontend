import { TestBed } from '@angular/core/testing';
import { WebSocketService } from '../websocket.service';

// Mock SockJS and STOMP Client
jest.mock('sockjs-client', () => {
  return jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    readyState: 1
  }));
});

jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn().mockImplementation(({ onConnect, onDisconnect }) => ({
    activate: jest.fn().mockImplementation(() => { if (onConnect) onConnect({}); }),
    deactivate: jest.fn().mockImplementation(() => { if (onDisconnect) onDisconnect({}); }),
    connected: true,
    subscribe: jest.fn().mockReturnValue({ id: 'sub-1', unsubscribe: jest.fn() }),
    publish: jest.fn()
  }))
}));

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [WebSocketService] });
    service = TestBed.inject(WebSocketService);
  });

  it('should create', () => expect(service).toBeTruthy());

  it('should connect and return a Subject', () => {
    const status$ = service.connect('test', 'http://localhost/ws');
    expect(status$).toBeTruthy();
    expect(typeof status$.subscribe).toBe('function');
  });

  it('should not create duplicate clients for same name', () => {
    const s1 = service.connect('myConn', 'http://localhost/ws');
    const s2 = service.connect('myConn', 'http://localhost/ws');
    expect(s1).toBe(s2);
  });

  it('should publish message to connected client', () => {
    service.connect('pub-test', 'http://localhost/ws');
    service.publish('pub-test', '/app/test', { data: 'hello' });
    // Client is mocked as connected, so no error thrown
  });

  it('should subscribe to destination', () => {
    service.connect('sub-test', 'http://localhost/ws');
    const sub = service.subscribe('sub-test', '/topic/test', jest.fn());
    expect(sub).toBeTruthy();
  });

  it('should return null when subscribing to unknown client', () => {
    const sub = service.subscribe('nonexistent', '/topic/test', jest.fn());
    expect(sub).toBeNull();
  });

  it('should disconnect and clean up client', () => {
    service.connect('dc-test', 'http://localhost/ws');
    service.disconnect('dc-test');
    // After disconnect, subscribing should return null
    const sub = service.subscribe('dc-test', '/topic/test', jest.fn());
    expect(sub).toBeNull();
  });
});

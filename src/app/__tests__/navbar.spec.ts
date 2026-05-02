import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/other-services';
import { User } from '../core/models';

const mockUser: User = {
  userId: 1, username: 'alice', email: 'alice@test.com', fullName: 'Alice',
  role: 'USER', avatarUrl: '', bio: '', provider: 'LOCAL',
  isActive: true, createdAt: ''
};

const adminUser: User = { ...mockUser, role: 'ADMIN' };

const makeAuthSvc = (user: User = mockUser) => ({
  getCurrentUser: jest.fn().mockReturnValue(user),
  logout: jest.fn().mockReturnValue(of({})),
  clearStorage: jest.fn()
});

const makeNotifSvc = () => ({
  getBadgeCount: jest.fn().mockReturnValue(of({ unreadCount: 3 })),
  getUnread: jest.fn().mockReturnValue(of([])),
  connectPush: jest.fn(),
  disconnectPush: jest.fn(),
  markRead: jest.fn().mockReturnValue(of(null)),
  notification$: new Subject<any>(),
  unreadCount$: new Subject<number>()
});

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authSvc: ReturnType<typeof makeAuthSvc>;
  let notifSvc: ReturnType<typeof makeNotifSvc>;

  beforeEach(async () => {
    authSvc = makeAuthSvc();
    notifSvc = makeNotifSvc();

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: NotificationService, useValue: notifSvc }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('should load current user on init', () => expect(component.user?.username).toBe('alice'));
  it('should load badge count on init', () => expect(component.unreadCount).toBe(3));
  it('should connect push notifications', () => expect(notifSvc.connectPush).toHaveBeenCalled());
  it('should set isAdmin false for USER', () => expect(component.isAdmin).toBe(false));

  it('should toggle notification menu', () => {
    expect(component.notifMenuOpen).toBe(false);
    component.toggleNotifMenu();
    expect(component.notifMenuOpen).toBe(true);
    component.toggleNotifMenu();
    expect(component.notifMenuOpen).toBe(false);
  });

  it('should close user menu when notif menu opens', () => {
    component.userMenuOpen = true;
    component.toggleNotifMenu();
    expect(component.userMenuOpen).toBe(false);
    expect(component.notifMenuOpen).toBe(true);
  });

  it('should toggle user menu', () => {
    component.toggleUserMenu();
    expect(component.userMenuOpen).toBe(true);
  });

  it('should close notif menu when user menu opens', () => {
    component.notifMenuOpen = true;
    component.toggleUserMenu();
    expect(component.notifMenuOpen).toBe(false);
    expect(component.userMenuOpen).toBe(true);
  });

  it('should call logout', () => {
    component.logout();
    expect(authSvc.logout).toHaveBeenCalled();
  });

  it('should return correct notification icons', () => {
    expect(component.getIcon('COMMENT')).toBe('💬');
    expect(component.getIcon('BROADCAST')).toBe('📢');
    expect(component.getIcon('UNKNOWN')).toBe('🔔');
  });

  it('should update unreadCount when unreadCount$ emits', () => {
    notifSvc.unreadCount$.next(7);
    expect(component.unreadCount).toBe(7);
  });

  it('should prepend new notification to recentNotifs', () => {
    const newNotif = { id: 99, title: 'New!', type: 'SYSTEM', read: false };
    notifSvc.notification$.next(newNotif);
    expect(component.recentNotifs[0]).toEqual(newNotif);
  });
});

describe('NavbarComponent – Admin', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: makeAuthSvc(adminUser) },
        { provide: NotificationService, useValue: makeNotifSvc() }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set isAdmin true for ADMIN role', () => expect(component.isAdmin).toBe(true));
});

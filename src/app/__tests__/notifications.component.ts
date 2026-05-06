import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/other-services';
import { Notification } from '../../core/models';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" #page>
      <div class="page-header" #pageHeader>
        <div class="header-left">
          <h1 class="bb">Notifications</h1>
          <div class="header-sub">Stay on top of your activity</div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="markAllRead()" [disabled]="!hasUnread">
            ✓ Mark all read
          </button>
          <button class="btn btn-danger" (click)="deleteRead()">
            🗑 Clear read
          </button>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="notif-stats" #statsBar>
        <div class="ns-item">
          <span class="ns-val bb">{{ notifications.length }}</span>
          <span class="ns-lbl">Total</span>
        </div>
        <div class="ns-divider"></div>
        <div class="ns-item">
          <span class="ns-val bb" style="color:var(--B)">{{ unreadCount }}</span>
          <span class="ns-lbl">Unread</span>
        </div>
        <div class="ns-divider"></div>
        <div class="ns-item">
          <span class="ns-val bb" style="color:var(--G)">{{ readCount }}</span>
          <span class="ns-lbl">Read</span>
        </div>
      </div>

      <!-- Empty state with animation -->
      <div class="empty-state" #emptyState *ngIf="!notifications.length">
        <div class="empty-bell">
          <div class="bell-ring">🔔</div>
          <div class="empty-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
        </div>
        <h2 class="bb">All quiet here</h2>
        <p>No notifications yet. When you get activity on your projects, it'll show up here.</p>
      </div>

      <!-- Notification list -->
      <div class="notif-list" #list *ngIf="notifications.length">
        <div class="notif-item" *ngFor="let n of notifications; trackBy: trackById"
             [class.unread]="!n.read"
             [attr.data-type]="n.type"
             (click)="markRead(n)">
          <div class="notif-accent"></div>
          <div class="notif-icon">{{ getIcon(n.type) }}</div>
          <div class="notif-body">
            <div class="notif-top">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-type-badge">{{ n.type }}</div>
            </div>
            <div class="notif-message">{{ n.message }}</div>
            <div class="notif-time">{{ n.createdAt | date:'MMM d, y · h:mm a' }}</div>
          </div>
          <div class="notif-actions">
            <div class="unread-dot" *ngIf="!n.read"></div>
            <button class="icon-btn" (click)="delete(n.id, $event)" title="Delete">✕</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:36px;max-width:860px;margin:0 auto; }

    /* Header */
    .page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:16px; }
    .header-left { display:flex;flex-direction:column;gap:4px; }
    h1 { font-size:44px;letter-spacing:.04em;line-height:1;margin:0; }
    .header-sub { font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;opacity:.5; }
    .header-actions { display:flex;gap:10px;flex-wrap:wrap;align-items:center; }

    .btn { display:inline-flex;align-items:center;gap:7px;padding:10px 20px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;border:3px solid var(--K);cursor:pointer;box-shadow:4px 4px 0 var(--K);background:var(--W);color:var(--K);transition:transform .08s,box-shadow .08s; }
    .btn:hover:not(:disabled) { transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--K); }
    .btn:disabled { opacity:.4;cursor:not-allowed;box-shadow:4px 4px 0 var(--K); }
    .btn-outline { background:transparent; }
    .btn-danger { background:var(--R);color:var(--W);border-color:var(--R); }

    /* Stats bar */
    .notif-stats { display:flex;align-items:center;gap:0;border:3px solid var(--K);box-shadow:4px 4px 0 var(--K);margin-bottom:28px;background:var(--W); }
    .ns-item { display:flex;flex-direction:column;align-items:center;padding:14px 28px;flex:1; }
    .ns-val { font-size:32px;letter-spacing:.03em;line-height:1; }
    .ns-lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.5;margin-top:4px; }
    .ns-divider { width:3px;height:48px;background:var(--K); }

    /* Empty state */
    .empty-state { text-align:center;padding:80px 20px; }
    .empty-bell { position:relative;display:inline-block;margin-bottom:28px; }
    .bell-ring { font-size:72px;animation:bellShake 3s ease-in-out infinite; }
    @keyframes bellShake {
      0%,90%,100% { transform:rotate(0deg); }
      92% { transform:rotate(12deg); }
      94% { transform:rotate(-10deg); }
      96% { transform:rotate(8deg); }
      98% { transform:rotate(-6deg); }
    }
    .empty-rings { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%); }
    .ring { position:absolute;border:3px solid var(--Y);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);animation:ringPulse 3s ease-out infinite; }
    .ring-1 { width:80px;height:80px;animation-delay:0s; }
    .ring-2 { width:120px;height:120px;animation-delay:.5s; }
    .ring-3 { width:160px;height:160px;animation-delay:1s; }
    @keyframes ringPulse {
      0% { opacity:.6;transform:translate(-50%,-50%) scale(.8); }
      100% { opacity:0;transform:translate(-50%,-50%) scale(1.2); }
    }
    .empty-state h2 { font-size:32px;letter-spacing:.04em;margin-bottom:12px; }
    .empty-state p { font-size:14px;opacity:.5;max-width:320px;margin:0 auto;line-height:1.6; }

    /* List */
    .notif-list { display:flex;flex-direction:column;gap:8px; }
    .notif-item { display:flex;align-items:flex-start;gap:0;border:3px solid var(--K);background:var(--W);cursor:pointer;box-shadow:4px 4px 0 var(--K);transition:transform .1s,box-shadow .1s;overflow:hidden;position:relative; }
    .notif-item:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--K); }
    .notif-item.unread { border-color:var(--B); box-shadow:4px 4px 0 var(--B); }
    .notif-item.unread:hover { box-shadow:6px 6px 0 var(--B); }
    .notif-accent { width:6px;flex-shrink:0;background:var(--K);align-self:stretch; }
    .notif-item.unread .notif-accent { background:var(--B); }
    .notif-item[data-type="COMMENT"] .notif-accent { background:var(--G); }
    .notif-item[data-type="COLLAB_INVITE"] .notif-accent { background:var(--B); }
    .notif-item[data-type="EXECUTION_DONE"] .notif-accent { background:var(--G); }
    .notif-item[data-type="SYSTEM"] .notif-accent { background:var(--Y); }
    .notif-item[data-type="BROADCAST"] .notif-accent { background:var(--R); }
    .notif-icon { font-size:22px;padding:16px 14px;flex-shrink:0; }
    .notif-body { flex:1;padding:14px 0; }
    .notif-top { display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap; }
    .notif-title { font-size:14px;font-weight:800;letter-spacing:.02em; }
    .notif-type-badge { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;background:var(--K);color:var(--W);padding:2px 7px; }
    .notif-item.unread .notif-type-badge { background:var(--B); }
    .notif-message { font-size:13px;opacity:.6;margin-bottom:7px;line-height:1.5; }
    .notif-time { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.35; }
    .notif-actions { display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 14px;flex-shrink:0; }
    .unread-dot { width:10px;height:10px;background:var(--B);border:2px solid var(--W);border-radius:50%; }
    .icon-btn { background:none;border:2px solid transparent;color:rgba(0,0,0,.3);cursor:pointer;padding:5px 7px;font-size:12px;font-weight:700;transition:all .15s; }
    .icon-btn:hover { background:var(--R);color:var(--W);border-color:var(--R); }

    @media(max-width:600px) { .page{padding:20px 16px;} h1{font-size:32px;} .ns-item{padding:12px 16px;} }
  `]
})
export class NotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('page') pageRef!: ElementRef;
  @ViewChild('pageHeader') headerRef!: ElementRef;
  @ViewChild('statsBar') statsBarRef!: ElementRef;
  @ViewChild('list') listRef!: ElementRef;
  @ViewChild('emptyState') emptyRef!: ElementRef;

  private notifSvc = inject(NotificationService);
  private toast = inject(ToastService);

  notifications: Notification[] = [];
  private sub!: Subscription;

  get hasUnread(): boolean { return this.notifications.some(n => !n.read); }
  get unreadCount(): number { return this.notifications.filter(n => !n.read).length; }
  get readCount(): number { return this.notifications.filter(n => n.read).length; }

  ngOnInit(): void {
    this.notifSvc.getAll().subscribe(n => { this.notifications = n; });
    this.notifSvc.connectPush();
    this.sub = this.notifSvc.notification$.subscribe(n => {
      this.notifications = [n, ...this.notifications];
      // Animate new notification in
      setTimeout(() => {
        const items = document.querySelectorAll('.notif-item');
        if (items.length) {
          gsap.fromTo(items[0], { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'back.out(1.4)' });
        }
      }, 50);
    });
  }

  ngAfterViewInit(): void {
    if (!this.pageRef?.nativeElement) return;
    const tl = gsap.timeline();
    tl.fromTo(this.pageRef.nativeElement,
        { opacity:0, y:20 }, { opacity:1, y:0, duration:.4, ease:'power2.out' });

    if (this.headerRef?.nativeElement) {
      tl.fromTo(this.headerRef.nativeElement,
        { opacity:0, y:-16 }, { opacity:1, y:0, duration:.35, ease:'power2.out' }, '-=.2');
    }
    if (this.statsBarRef?.nativeElement) {
      tl.fromTo(this.statsBarRef.nativeElement,
        { opacity:0, scaleX:.95 }, { opacity:1, scaleX:1, duration:.3, ease:'power2.out' }, '-=.1');
    }

    setTimeout(() => {
      if (this.listRef?.nativeElement) {
        gsap.fromTo(this.listRef.nativeElement.querySelectorAll('.notif-item'),
          { opacity:0, x:-20 },
          { opacity:1, x:0, duration:.3, stagger:.05, ease:'power2.out' });
      }
      if (this.emptyRef?.nativeElement) {
        gsap.fromTo(this.emptyRef.nativeElement,
          { opacity:0, scale:.9 }, { opacity:1, scale:1, duration:.5, ease:'back.out(1.2)' });
      }
    }, 300);
  }

  markRead(n: Notification): void {
    if (n.read) return;
    this.notifSvc.markRead(n.id).subscribe(() => {
      this.notifications = this.notifications.map(x => x.id === n.id ? { ...x, read: true } : x);
    });
  }

  markAllRead(): void {
    this.notifSvc.markAllRead().subscribe(() => {
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
      this.toast.success('All marked as read');
    });
  }

  deleteRead(): void {
    this.notifSvc.deleteRead().subscribe(() => {
      this.notifications = this.notifications.filter(n => !n.read);
      this.toast.success('Read notifications cleared');
    });
  }

  delete(id: number, e: Event): void {
    e.stopPropagation();
    // Always call the API — the server delete must happen regardless of animation.
    // Previously notifSvc.delete was only called in the else branch (no DOM element
    // found), meaning the deletion was never persisted when animation ran.
    this.notifSvc.delete(id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    });
    // Animate the row out in parallel if the DOM element is available.
    const el = (e.target as HTMLElement)?.closest('.notif-item');
    if (el) {
      gsap.to(el, { opacity: 0, x: 40, duration: 0.25, ease: 'power2.in' });
    }
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      COMMENT: '💬', COLLAB_INVITE: '👥', EXECUTION_DONE: '✅', SYSTEM: '⚙️', BROADCAST: '📢'
    };
    return icons[type] || '🔔';
  }

  trackById(_: number, n: Notification): number { return n.id; }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.notifSvc.disconnectPush();
  }
}

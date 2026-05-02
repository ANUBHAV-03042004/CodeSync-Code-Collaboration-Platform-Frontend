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
      <div class="page-header">
        <h1>Notifications</h1>
        <div class="header-actions">
          <button class="btn-outline" (click)="markAllRead()" [disabled]="!hasUnread">Mark all read</button>
          <button class="btn-outline btn-danger" (click)="deleteRead()">Clear read</button>
        </div>
      </div>

      <div class="notif-list" #list>
        <div class="notif-item" *ngFor="let n of notifications; trackBy: trackById"
             [class.unread]="!n.read" (click)="markRead(n)">
          <div class="notif-icon">{{ getIcon(n.type) }}</div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-message">{{ n.message }}</div>
            <div class="notif-time">{{ n.createdAt | date:'short' }}</div>
          </div>
          <div class="notif-actions">
            <button class="icon-btn" (click)="delete(n.id, $event)" title="Delete">✕</button>
          </div>
        </div>

        <div class="empty" *ngIf="!notifications.length">
          <div class="empty-icon">🔔</div>
          <p>No notifications yet</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 28px; margin: 0; }
    .header-actions { display: flex; gap: 10px; }
    .btn-outline { background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;
      padding: 8px 16px; color: rgba(255,255,255,0.7); font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .btn-outline:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
    .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-danger { border-color: rgba(239,68,68,0.3); color: #f87171; }
    .btn-danger:hover { border-color: #ef4444; background: rgba(239,68,68,0.1); }
    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .notif-item:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.15); }
    .notif-item.unread { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.25); }
    .notif-item.unread .notif-title { color: #c7d2fe; }
    .notif-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
    .notif-body { flex: 1; }
    .notif-title { color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .notif-message { color: rgba(255,255,255,0.55); font-size: 13px; margin-bottom: 6px; }
    .notif-time { color: rgba(255,255,255,0.3); font-size: 12px; }
    .notif-actions { flex-shrink: 0; }
    .icon-btn { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer;
      padding: 4px 6px; border-radius: 4px; font-size: 13px; transition: all 0.15s; }
    .icon-btn:hover { background: rgba(239,68,68,0.15); color: #f87171; }
    .empty { text-align: center; padding: 60px; color: rgba(255,255,255,0.4); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty p { margin: 0; font-size: 15px; }
  `]
})
export class NotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('page') pageRef!: ElementRef;
  @ViewChild('list') listRef!: ElementRef;

  private notifSvc = inject(NotificationService);
  private toast = inject(ToastService);

  notifications: Notification[] = [];
  private sub!: Subscription;

  get hasUnread(): boolean { return this.notifications.some(n => !n.read); }

  ngOnInit(): void {
    this.notifSvc.getAll().subscribe(n => { this.notifications = n; });
    this.notifSvc.connectPush();
    this.sub = this.notifSvc.notification$.subscribe(n => {
      this.notifications = [n, ...this.notifications];
    });
  }

  ngAfterViewInit(): void {
    gsap.fromTo(this.pageRef.nativeElement,
      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    setTimeout(() => {
      if (this.listRef) {
        gsap.fromTo(this.listRef.nativeElement.querySelectorAll('.notif-item'),
          { opacity: 0, x: -16 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
      }
    }, 200);
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
    this.notifSvc.delete(id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    });
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

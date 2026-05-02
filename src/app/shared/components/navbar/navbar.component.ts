import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { gsap } from 'gsap';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/other-services';
import { User } from '../../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="nb-wrapper" #navbar>
      <!-- Main Navbar -->
      <nav class="navbar">
        <!-- Brand (single logo) -->
        <a class="nb-brand" [routerLink]="user ? '/dashboard' : '/'">
          <div class="nb-bolt">⚡</div>
          <span class="nb-name">CODE<span class="nb-name-accent">SYNC</span></span>
        </a>

        <!-- Nav links — only when logged in -->
        <div class="nb-links" *ngIf="user">
          <a routerLink="/dashboard" routerLinkActive="act">Dashboard</a>
          <a routerLink="/projects"  routerLinkActive="act">Projects</a>
          <a routerLink="/notifications" routerLinkActive="act">Notifications</a>
          <a routerLink="/admin" routerLinkActive="act" *ngIf="isAdmin">Admin</a>
        </div>

        <!-- Right side -->
        <div class="nb-right">

          <!-- LOGGED IN: Bell + User -->
          <ng-container *ngIf="user; else loggedOut">
            <!-- Bell -->
            <div class="nb-bell" (click)="toggleNotifMenu(); $event.stopPropagation()">
              🔔
              <div class="nb-dot" *ngIf="unreadCount > 0"></div>
              <div class="nb-dd" [class.open]="notifMenuOpen" (click)="$event.stopPropagation()">
                <div class="dd-hdr"><span class="dd-label">Notifications</span></div>
                <div class="dd-item" *ngFor="let n of recentNotifs" [class.unread]="!n.read" (click)="openNotif(n)">
                  <span>{{ getIcon(n.type) }}</span>
                  <div>
                    <div style="font-size:12px">{{ n.title }}</div>
                    <div style="font-size:10px;opacity:.4;margin-top:2px">{{ n.createdAt | date:'shortTime' }}</div>
                  </div>
                </div>
                <div class="dd-empty" *ngIf="!recentNotifs.length">No notifications</div>
                <div class="dd-item see-all" routerLink="/notifications" (click)="notifMenuOpen=false">See all →</div>
              </div>
            </div>

            <!-- User menu -->
            <div class="nb-user" (click)="toggleUserMenu(); $event.stopPropagation()">
              <div class="nb-av" [style.background]="avatarColor">{{ user!.username[0].toUpperCase() }}</div>
              <span class="nb-uname">{{ user!.username }}</span>
              <span class="nb-caret">▾</span>
              <div class="nb-dd" [class.open]="userMenuOpen" (click)="$event.stopPropagation()">
                <div class="dd-hdr">
                  <div class="dd-email">{{ user!.email }}</div>
                  <div class="dd-role">{{ user!.role }}</div>
                </div>
                <a class="dd-item" routerLink="/notifications" (click)="userMenuOpen=false">🔔 Notifications</a>
                <a class="dd-item" routerLink="/admin" (click)="userMenuOpen=false" *ngIf="isAdmin">⚙️ Admin Panel</a>
                <div class="dd-sep"></div>
                <div class="dd-item danger" (click)="logout()">🚪 Sign Out</div>
              </div>
            </div>
          </ng-container>

          <!-- LOGGED OUT: Sign In + CTA -->
          <ng-template #loggedOut>
            <a class="nb-signin" routerLink="/login">Sign In</a>
            <a class="nb-cta" routerLink="/register">GET STARTED FREE →</a>
          </ng-template>

        </div>
      </nav>

      <!-- Ticker strip -->
      <div class="nb-ticker">
        <div class="nb-ticker-track">
          <span *ngFor="let item of tickerItems">· {{ item }} </span>
          <span *ngFor="let item of tickerItems">· {{ item }} </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Wrapper ── */
    .nb-wrapper {
      position: sticky; top: 0; z-index: 200;
      background: var(--K);
    }

    /* ── Main navbar ── */
    .navbar {
      height: 64px;
      background: var(--K);
      border-bottom: 3px solid var(--Y);
      display: flex; align-items: center; padding: 0 28px; gap: 0;
    }

    /* ── Brand ── */
    .nb-brand { display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;margin-right:36px;flex-shrink:0; }
    .nb-bolt { width:36px;height:36px;background:var(--Y);border:2px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;flex-shrink:0; }
    .nb-name { font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:.08em;color:var(--W); }
    .nb-name-accent { color:var(--Y); }

    /* ── Nav links (logged in) ── */
    .nb-links { display:flex;gap:0; }
    .nb-links a { color:rgba(255,255,240,.5);text-decoration:none;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:8px 16px;border:2px solid transparent;cursor:pointer;transition:all .15s; }
    .nb-links a:hover { color:var(--W);border-color:rgba(255,255,240,.2); }
    .nb-links a.act { color:var(--Y);border-color:var(--Y); }

    /* ── Right section ── */
    .nb-right { margin-left:auto;display:flex;align-items:center;gap:12px; }

    /* ── Bell ── */
    .nb-bell { position:relative;width:42px;height:42px;border:2px solid rgba(255,255,240,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;transition:border-color .15s,background .15s;flex-shrink:0; }
    .nb-bell:hover { border-color:var(--Y);background:rgba(255,214,0,.1); }
    .nb-dot { position:absolute;top:7px;right:7px;width:8px;height:8px;background:var(--R);border:2px solid var(--K); }

    /* ── User pill ── */
    .nb-user { display:flex;align-items:center;gap:8px;padding:6px 12px;border:2px solid rgba(255,255,240,.2);cursor:pointer;transition:border-color .15s;position:relative; }
    .nb-user:hover { border-color:var(--Y); }
    .nb-av { width:30px;height:30px;background:var(--B);border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--W);flex-shrink:0; }
    .nb-uname { color:rgba(255,255,240,.85);font-size:13px;font-weight:700; }
    .nb-caret { color:rgba(255,255,240,.35);font-size:11px; }

    /* ── Logged-out CTAs ── */
    .nb-signin { color:rgba(255,255,240,.75);text-decoration:none;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;transition:color .15s; }
    .nb-signin:hover { color:var(--W); }
    .nb-cta { background:var(--Y);color:#111;text-decoration:none;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;padding:10px 20px;border:2px solid var(--Y);transition:background .15s,color .15s; }
    .nb-cta:hover { background:transparent;color:var(--Y); }

    /* ── Dropdown ── */
    .nb-dd { position:absolute;top:calc(100% + 6px);right:0;background:var(--K);border:3px solid var(--Y);box-shadow:5px 5px 0 var(--Y);min-width:220px;z-index:300;display:none; }
    .nb-dd.open { display:block; }
    .dd-hdr { padding:10px 16px 8px;border-bottom:2px solid rgba(255,255,240,.1);margin-bottom:2px; }
    .dd-label { color:var(--Y);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em; }
    .dd-email { font-size:11px;color:rgba(255,255,240,.35);font-weight:400; }
    .dd-role { display:inline-block;background:var(--B);color:var(--W);font-size:10px;padding:2px 8px;font-weight:700;text-transform:uppercase;margin-top:5px; }
    .dd-item { display:flex;align-items:center;gap:10px;padding:11px 16px;color:rgba(255,255,240,.8);font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;border-bottom:1px solid rgba(255,255,240,.06);transition:background .1s,color .1s;text-decoration:none; }
    .dd-item:hover { background:rgba(255,214,0,.15);color:var(--Y); }
    .dd-item.unread { background:rgba(255,214,0,.05); }
    .dd-item.danger { color:#ff8888; }
    .dd-item.danger:hover { background:rgba(255,45,45,.2);color:var(--R); }
    .dd-item.see-all { color:var(--Y);border-top:2px solid rgba(255,214,0,.2);font-size:11px; }
    .dd-empty { padding:14px 16px;color:rgba(255,255,240,.3);font-size:12px;font-style:italic; }
    .dd-sep { height:1px;background:rgba(255,255,240,.08);margin:4px 0; }

    /* ── Ticker strip ── */
    .nb-ticker {
      height: 28px; background: var(--Y); overflow: hidden;
      display: flex; align-items: center;
    }
    .nb-ticker-track {
      display: flex; white-space: nowrap;
      animation: ticker 30s linear infinite;
      color: #111; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .08em; gap: 0;
    }
    .nb-ticker-track span { padding: 0 8px; }
    @keyframes ticker {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('navbar') navbarRef!: ElementRef;

  tickerItems = [
    'Instant Execution', 'Version History', 'Comment Anywhere',
    'Team Collab', 'Open Source', 'CodeSync',
    'Collaborate', 'Real-Time Editor'
  ];
  private authSvc = inject(AuthService);
  private notifSvc = inject(NotificationService);
  private router = inject(Router);

  user: User | null = null;
  unreadCount = 0;
  recentNotifs: any[] = [];
  notifMenuOpen = false;
  userMenuOpen = false;
  avatarColor = '#1A6FFF';
  private subs: Subscription[] = [];
  get isAdmin(): boolean { return this.user?.role === 'ADMIN'; }

  ngOnInit(): void {
    this.user = this.authSvc.getCurrentUser();
    if (this.user) {
      const colors = ['#FF2D2D','#1A6FFF','#00C853','#FFD600'];
      this.avatarColor = colors[this.user.username.charCodeAt(0) % colors.length];
      this.notifSvc.getBadgeCount().subscribe(r => this.unreadCount = r.unreadCount);
      this.notifSvc.getUnread().subscribe(n => this.recentNotifs = n.slice(0, 5));
      this.notifSvc.connectPush();
      this.subs.push(
        this.notifSvc.unreadCount$.subscribe(c => this.unreadCount = c),
        this.notifSvc.notification$.subscribe(n => this.recentNotifs = [n, ...this.recentNotifs].slice(0, 5))
      );
    }
    this.subs.push(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => { this.notifMenuOpen = false; this.userMenuOpen = false; })
    );
    document.addEventListener('click', () => { this.notifMenuOpen = false; this.userMenuOpen = false; });
  }

  ngAfterViewInit(): void {
    gsap.fromTo(this.navbarRef.nativeElement,
      { y: -92, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
  }

  toggleNotifMenu(): void { this.notifMenuOpen = !this.notifMenuOpen; this.userMenuOpen = false; }
  toggleUserMenu(): void { this.userMenuOpen = !this.userMenuOpen; this.notifMenuOpen = false; }

  openNotif(n: any): void {
    this.notifSvc.markRead(n.id).subscribe();
    this.notifMenuOpen = false;
    if (n.deepLinkUrl) this.router.navigateByUrl(n.deepLinkUrl);
    else this.router.navigate(['/notifications']);
  }

  logout(): void {
    this.authSvc.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => { this.authSvc.clearStorage(); this.router.navigate(['/login']); }
    });
  }

  getIcon(type: string): string {
    const icons: Record<string,string> = { COMMENT:'💬', COLLAB_INVITE:'👥', EXECUTION_DONE:'✅', SYSTEM:'⚙️', BROADCAST:'📢' };
    return icons[type] || '🔔';
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); this.notifSvc.disconnectPush(); }
}
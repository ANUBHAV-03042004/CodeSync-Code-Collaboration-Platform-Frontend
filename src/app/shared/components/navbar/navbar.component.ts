import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener, inject, NgZone } from '@angular/core';
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
      <nav class="navbar">
        <a class="nb-brand" [routerLink]="user ? '/dashboard' : '/'">
          <div class="nb-bolt">⚡</div>
          <span class="nb-name">YOURS<span class="nb-name-accent">CODE</span></span>
        </a>

        <div class="nb-links" *ngIf="user">
          <a routerLink="/dashboard" routerLinkActive="act">Dashboard</a>
          <a routerLink="/projects"  routerLinkActive="act">Projects</a>
          <a routerLink="/notifications" routerLinkActive="act">Notifications</a>
          <a routerLink="/admin" routerLinkActive="act" *ngIf="isAdmin">Admin</a>
        </div>

        <div class="nb-right">
          <ng-container *ngIf="user; else loggedOut">
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

            <div class="nb-user" (click)="toggleUserMenu(); $event.stopPropagation()">
              <div class="nb-av" [style.background]="avatarColor">{{ user.username ? user.username[0].toUpperCase() : '?' }}</div>
              <span class="nb-uname">{{ user.username }}</span>
              <span class="nb-caret">▾</span>
              <div class="nb-dd" [class.open]="userMenuOpen" (click)="$event.stopPropagation()">
                <div class="dd-hdr">
                  <div class="dd-email">{{ user.email }}</div>
                  <div class="dd-role">{{ user.role }}</div>
                </div>
                <a class="dd-item" routerLink="/profile" (click)="userMenuOpen=false">👤 My Profile</a>
                <a class="dd-item" routerLink="/notifications" (click)="userMenuOpen=false">🔔 Notifications</a>
                <a class="dd-item" routerLink="/admin" (click)="userMenuOpen=false" *ngIf="isAdmin">⚙️ Admin Panel</a>
                <div class="dd-sep"></div>
                <div class="dd-item danger" (click)="logout()">🚪 Sign Out</div>
              </div>
            </div>

            <button class="nb-hamburger" (click)="toggleMobileMenu(); $event.stopPropagation()" [class.active]="mobileMenuOpen">
              <span></span><span></span><span></span>
            </button>
          </ng-container>

          <ng-template #loggedOut>
            <a class="nb-signin" routerLink="/login">Sign In</a>
            <a class="nb-cta" routerLink="/register">GET STARTED FREE →</a>
            <button class="nb-hamburger" (click)="toggleMobileMenu(); $event.stopPropagation()" [class.active]="mobileMenuOpen">
              <span></span><span></span><span></span>
            </button>
          </ng-template>
        </div>
      </nav>

      <!-- Mobile Menu -->
      <div class="nb-mobile-menu" [class.open]="mobileMenuOpen" (click)="$event.stopPropagation()">
        <ng-container *ngIf="user; else mobileLoggedOut">
          <div class="mm-user-info">
            <div class="mm-av" [style.background]="avatarColor">{{ user.username ? user.username[0].toUpperCase() : '?' }}</div>
            <div>
              <div class="mm-uname">{{ user.username }}</div>
              <div class="mm-email">{{ user.email }}</div>
            </div>
          </div>
          <div class="mm-sep"></div>
          <a class="mm-link" routerLink="/dashboard" routerLinkActive="act" (click)="mobileMenuOpen=false">📊 Dashboard</a>
          <a class="mm-link" routerLink="/projects" routerLinkActive="act" (click)="mobileMenuOpen=false">📁 Projects</a>
          <a class="mm-link" routerLink="/notifications" routerLinkActive="act" (click)="mobileMenuOpen=false">
            🔔 Notifications
            <span class="mm-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          </a>
          <a class="mm-link" routerLink="/profile" routerLinkActive="act" (click)="mobileMenuOpen=false">👤 Profile</a>
          <a class="mm-link" routerLink="/admin" routerLinkActive="act" (click)="mobileMenuOpen=false" *ngIf="isAdmin">⚙️ Admin</a>
          <div class="mm-sep"></div>
          <div class="mm-link danger" (click)="logout()">🚪 Sign Out</div>
        </ng-container>
        <ng-template #mobileLoggedOut>
          <a class="mm-link" routerLink="/login" (click)="mobileMenuOpen=false">Sign In</a>
          <a class="mm-link mm-cta" routerLink="/register" (click)="mobileMenuOpen=false">Get Started Free →</a>
        </ng-template>
      </div>

      <!-- Ticker -->
      <div class="nb-ticker">
        <div class="nb-ticker-track">
          <span *ngFor="let item of tickerItems">· {{ item }} </span>
          <span *ngFor="let item of tickerItems">· {{ item }} </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nb-wrapper { position:sticky;top:0;z-index:200;background:var(--K); }
    .navbar { height:64px;background:var(--K);border-bottom:3px solid var(--Y);display:flex;align-items:center;padding:0 28px;gap:0; }
    .nb-brand { display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;margin-right:36px;flex-shrink:0; }
    .nb-bolt { width:36px;height:36px;background:var(--Y);border:2px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;flex-shrink:0; }
    .nb-name { font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:.08em;color:var(--W); }
    .nb-name-accent { color:var(--Y); }
    .nb-links { display:flex;gap:0; }
    .nb-links a { color:rgba(255,255,240,.5);text-decoration:none;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:8px 16px;border:2px solid transparent;cursor:pointer;transition:all .15s; }
    .nb-links a:hover { color:var(--W);border-color:rgba(255,255,240,.2); }
    .nb-links a.act { color:var(--Y);border-color:var(--Y); }
    .nb-right { margin-left:auto;display:flex;align-items:center;gap:12px; }
    .nb-bell { position:relative;width:42px;height:42px;border:2px solid rgba(255,255,240,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;transition:border-color .15s,background .15s;flex-shrink:0; }
    .nb-bell:hover { border-color:var(--Y);background:rgba(255,214,0,.1); }
    .nb-dot { position:absolute;top:7px;right:7px;width:8px;height:8px;background:var(--R);border:2px solid var(--K); }
    .nb-user { display:flex;align-items:center;gap:8px;padding:6px 12px;border:2px solid rgba(255,255,240,.2);cursor:pointer;transition:border-color .15s;position:relative; }
    .nb-user:hover { border-color:var(--Y); }
    .nb-av { width:30px;height:30px;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--W);flex-shrink:0; }
    .nb-uname { color:rgba(255,255,240,.85);font-size:13px;font-weight:700; }
    .nb-caret { color:rgba(255,255,240,.35);font-size:11px; }
    .nb-signin { color:rgba(255,255,240,.75);text-decoration:none;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:8px 16px;transition:color .15s; }
    .nb-signin:hover { color:var(--W); }
    .nb-cta { background:var(--Y);color:#111;text-decoration:none;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;padding:10px 20px;border:2px solid var(--Y);transition:background .15s,color .15s; }
    .nb-cta:hover { background:transparent;color:var(--Y); }
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
    /* Hamburger */
    .nb-hamburger { display:none;flex-direction:column;justify-content:center;gap:5px;width:42px;height:42px;background:none;border:2px solid rgba(255,255,240,.25);cursor:pointer;padding:8px;transition:border-color .15s; }
    .nb-hamburger:hover { border-color:var(--Y); }
    .nb-hamburger span { display:block;width:100%;height:2px;background:var(--W);transition:transform .25s,opacity .25s; }
    .nb-hamburger.active span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
    .nb-hamburger.active span:nth-child(2) { opacity:0; }
    .nb-hamburger.active span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }
    /* Mobile menu */
    .nb-mobile-menu { display:none;flex-direction:column;background:var(--K);border-bottom:3px solid var(--Y);overflow:hidden;max-height:0;transition:max-height .35s ease; }
    .nb-mobile-menu.open { max-height:600px; }
    .mm-user-info { display:flex;align-items:center;gap:14px;padding:18px 20px; }
    .mm-av { width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--W);border:2px solid rgba(255,255,255,.15);flex-shrink:0; }
    .mm-uname { color:var(--W);font-size:15px;font-weight:700; }
    .mm-email { color:rgba(255,255,240,.35);font-size:11px;margin-top:2px; }
    .mm-sep { height:1px;background:rgba(255,255,240,.1);margin:4px 0; }
    .mm-link { display:flex;align-items:center;gap:10px;padding:14px 20px;color:rgba(255,255,240,.7);text-decoration:none;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid rgba(255,255,240,.06);cursor:pointer;transition:background .15s,color .15s; }
    .mm-link:hover,.mm-link.act { background:rgba(255,214,0,.1);color:var(--Y); }
    .mm-link.danger { color:#ff8888; }
    .mm-link.mm-cta { background:var(--Y);color:#111; }
    .mm-badge { margin-left:auto;background:var(--R);color:var(--W);font-size:11px;font-weight:800;padding:2px 7px;min-width:20px;text-align:center; }
    /* Ticker */
    .nb-ticker { height:28px;background:var(--Y);overflow:hidden;display:flex;align-items:center; }
    .nb-ticker-track { display:flex;white-space:nowrap;animation:ticker 30s linear infinite;color:#111;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em; }
    .nb-ticker-track span { padding:0 8px; }
    @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    /* Responsive */
    @media(max-width:768px) {
      .nb-links { display:none; }
      .nb-uname,.nb-caret,.nb-cta,.nb-signin { display:none; }
      .nb-hamburger { display:flex; }
      .nb-mobile-menu { display:flex; }
      .navbar { padding:0 16px; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('navbar') navbarRef!: ElementRef;

  tickerItems = ['Instant Execution','Version History','Comment Anywhere','Team Collab','Open Source','YoursCode','Collaborate','Real-Time Editor'];
  private authSvc = inject(AuthService);
  private notifSvc = inject(NotificationService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  user: User | null = null;
  unreadCount = 0;
  recentNotifs: any[] = [];
  notifMenuOpen = false;
  userMenuOpen = false;
  mobileMenuOpen = false;
  avatarColor = '#1A6FFF';
  private subs: Subscription[] = [];
  get isAdmin(): boolean { return this.user?.role === 'ADMIN'; }

  @HostListener('document:click')
  onDocClick(): void { this.notifMenuOpen = false; this.userMenuOpen = false; this.mobileMenuOpen = false; }

  ngOnInit(): void {
    this.user = this.authSvc.getCurrentUser();
    if (this.user && this.user.username) {
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
        .subscribe(() => { this.notifMenuOpen = false; this.userMenuOpen = false; this.mobileMenuOpen = false; })
    );
  }

  ngAfterViewInit(): void {
    if (this.navbarRef?.nativeElement) {
      gsap.fromTo(this.navbarRef.nativeElement, { y:-92,opacity:0 }, { y:0,opacity:1,duration:.5,ease:'power3.out' });
    }
  }

  toggleNotifMenu(): void { this.notifMenuOpen = !this.notifMenuOpen; this.userMenuOpen = false; this.mobileMenuOpen = false; }
  toggleUserMenu(): void { this.userMenuOpen = !this.userMenuOpen; this.notifMenuOpen = false; this.mobileMenuOpen = false; }
  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; this.notifMenuOpen = false; this.userMenuOpen = false; }

  openNotif(n: any): void {
    this.notifSvc.markRead(n.id).subscribe();
    this.notifMenuOpen = false;
    if (n.deepLinkUrl) this.router.navigateByUrl(n.deepLinkUrl);
    else this.router.navigate(['/notifications']);
  }

  logout(): void {
    this.authSvc.logout().subscribe({
      next: () => this.ngZone.run(() => this.router.navigate(['/login'])),
      error: () => { this.authSvc.clearStorage(); this.ngZone.run(() => this.router.navigate(['/login'])); }
    });
  }

  getIcon(type: string): string {
    const icons: Record<string,string> = { COMMENT:'💬', COLLAB_INVITE:'👥', EXECUTION_DONE:'✅', SYSTEM:'⚙️', BROADCAST:'📢' };
    return icons[type] || '🔔';
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); this.notifSvc.disconnectPush(); }
}

import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin" #page>
      <!-- Hero Header -->
      <header class="hero" #header>
        <div class="hero-left">
          <div class="hero-eyebrow">Admin Panel</div>
          <h1 class="bb">User <span class="accent">Management</span> 🛡️</h1>
          <div class="hero-date">📅 {{ today | date:'EEEE, MMMM d, yyyy' }}</div>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid" #pills>
        <div class="sc sc-B">
          <div class="sc-lbl">Total Users</div>
          <div class="sc-val bb">{{ users.length }}</div>
          <div class="sc-ico">👥</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:100%"></div></div>
        </div>
        <div class="sc sc-G">
          <div class="sc-lbl">Active</div>
          <div class="sc-val bb">{{ activeCount }}</div>
          <div class="sc-ico">✅</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:70%"></div></div>
        </div>
        <div class="sc sc-R">
          <div class="sc-lbl">Inactive</div>
          <div class="sc-val bb">{{ users.length - activeCount }}</div>
          <div class="sc-ico">⛔</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:30%"></div></div>
        </div>
        <div class="sc sc-Y">
          <div class="sc-lbl">Admins</div>
          <div class="sc-val bb">{{ adminCount }}</div>
          <div class="sc-ico">👑</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:15%"></div></div>
        </div>
      </div>

      <!-- Section Title -->
      <div class="sec-row">
        <h2 class="bb">All Users</h2>
        <div class="sec-bar"></div>
        <span class="result-count">{{ filtered.length }} result{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input [(ngModel)]="search" (input)="applyFilters()" placeholder="Search by name, email, username…" class="search-input" />
        </div>
        <select [(ngModel)]="filterRole" (change)="applyFilters()" class="filter-select">
          <option value="">⚙️ All Roles</option>
          <option value="GUEST">GUEST</option>
          <option value="DEVELOPER">DEVELOPER</option>
          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
        </select>
        <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="filter-select">
          <option value="">📊 All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="table-wrap" #table>
        <table class="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of filtered; let i = index" [class.inactive-row]="!u.isActive" [class.alt-row]="i % 2 === 1">
              <td>
                <div class="user-cell">
                  <div class="avatar" [style.background]="getAvatarColor(u.username)">
                    {{ (u.username[0] || '?').toUpperCase() }}
                  </div>
                  <div>
                    <div class="username">{{ u.username }}</div>
                    <div class="fullname">{{ u.fullName }}</div>
                  </div>
                </div>
              </td>
              <td class="email-cell">{{ u.email }}</td>
              <td>
                <span class="role-badge" [class.admin]="u.role === 'ADMINISTRATOR'" [class.dev]="u.role === 'DEVELOPER'">{{ u.role }}</span>
              </td>
              <td>
                <span class="provider-badge" [class.github]="u.provider === 'GITHUB'">{{ u.provider }}</span>
              </td>
              <td>
                <span class="status-badge" [class.active]="u.isActive">
                  {{ u.isActive ? '● Active' : '○ Inactive' }}
                </span>
              </td>
              <td class="date-cell">{{ u.createdAt | date:'mediumDate' }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-neo btn-react" *ngIf="!u.isActive" (click)="reactivate(u.userId)">↻ Reactivate</button>
                  <button class="btn-neo btn-del" (click)="confirmDelete(u)">✕ Delete</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!filtered.length">
              <td colspan="7" class="empty-row">
                <div class="empty-state">
                  <span class="empty-icon">🔍</span>
                  <span>No users match the current filters.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Delete Confirm Modal -->
      <div class="modal-overlay" *ngIf="userToDelete" (click)="userToDelete = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-icon">⚠️</div>
          <h3 class="bb">Delete User?</h3>
          <p>Are you sure you want to permanently delete <strong>{{ userToDelete.username }}</strong>? This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-neo btn-cancel" (click)="userToDelete = null">Cancel</button>
            <button class="btn-neo btn-confirm-del" (click)="deleteUser()">Delete Permanently</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== LAYOUT ===== */
    .admin { padding: 36px; max-width: 1280px; margin: 0 auto; }

    /* ===== HERO HEADER ===== */
    .hero { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 4px solid var(--K); gap: 20px; flex-wrap: wrap; }
    .hero-left { display: flex; flex-direction: column; gap: 8px; }
    .hero-eyebrow { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--B); opacity: 0.8; }
    h1 { font-size: 52px; letter-spacing: 0.04em; line-height: 1; margin: 0; color: var(--K); }
    .accent { color: var(--B); }
    .hero-date { display: inline-flex; align-items: center; background: var(--Y); border: 2px solid var(--K); padding: 5px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; box-shadow: 3px 3px 0 var(--K); color: var(--K); width: fit-content; }

    /* ===== STATS GRID ===== */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 36px; }
    .sc { border: 3px solid var(--K); padding: 22px; position: relative; overflow: hidden; box-shadow: 5px 5px 0 var(--K); transition: transform 0.15s, box-shadow 0.15s; cursor: default; }
    .sc:hover { transform: translate(-3px, -3px); box-shadow: 8px 8px 0 var(--K); }
    .sc-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; opacity: 0.7; }
    .sc-val { font-size: 54px; letter-spacing: 0.03em; line-height: 1; }
    .sc-ico { position: absolute; bottom: 28px; right: 14px; font-size: 38px; opacity: 0.15; }
    .sc-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: rgba(0,0,0,0.15); }
    .sc-bar-fill { height: 100%; background: rgba(255,255,255,0.4); transition: width 1s ease; }
    .sc-B { background: var(--B); color: var(--W); }
    .sc-G { background: var(--G); color: var(--K); }
    .sc-R { background: var(--R); color: var(--W); }
    .sc-Y { background: var(--Y); color: var(--K); }

    /* ===== SECTION ROW ===== */
    .sec-row { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
    .sec-row h2 { font-size: 28px; letter-spacing: 0.06em; white-space: nowrap; margin: 0; color: var(--K); }
    .sec-bar { flex: 1; height: 3px; background: var(--K); }
    .result-count { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--B); white-space: nowrap; background: var(--Y); border: 2px solid var(--K); padding: 4px 12px; box-shadow: 2px 2px 0 var(--K); }

    /* ===== TOOLBAR ===== */
    .toolbar { display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-wrap { flex: 1; min-width: 280px; position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 14px; font-size: 16px; z-index: 1; pointer-events: none; }
    .search-input { width: 100%; background: var(--W); border: 3px solid var(--K); padding: 12px 18px 12px 40px; color: var(--K); font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 14px; outline: none; box-shadow: 4px 4px 0 var(--K); transition: transform 0.1s, box-shadow 0.1s; }
    .search-input:focus { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--K); }
    .search-input::placeholder { color: rgba(10, 10, 10, 0.4); font-weight: 500; }
    .filter-select { background: var(--W); border: 3px solid var(--K); padding: 12px 16px; color: var(--K); font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; outline: none; cursor: pointer; box-shadow: 4px 4px 0 var(--K); transition: transform 0.1s, box-shadow 0.1s; -webkit-appearance: none; }
    .filter-select:focus { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--K); }
    .filter-select option { background: var(--W); color: var(--K); font-family: 'Space Grotesk', sans-serif; font-weight: 600; }

    /* ===== TABLE ===== */
    .table-wrap { background: var(--W); border: 3px solid var(--K); box-shadow: 6px 6px 0 var(--K); overflow: hidden; overflow-x: auto; margin-bottom: 40px; }
    .user-table { width: 100%; border-collapse: collapse; text-align: left; }
    .user-table th { background: var(--K); color: var(--W); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 16px 18px; }
    .user-table td { padding: 16px 18px; border-top: 2px solid rgba(10,10,10,0.12); vertical-align: middle; background: var(--W); color: var(--K); transition: background 0.15s; }
    .user-table tbody tr:first-child td { border-top: none; }
    .alt-row td { background: var(--O); }
    .user-table tbody tr:hover td { background: var(--Y) !important; }
    .inactive-row td { opacity: 0.5; }

    /* ===== USER CELL ===== */
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--W); font-weight: 800; font-size: 16px; border: 3px solid var(--K); flex-shrink: 0; box-shadow: 2px 2px 0 var(--K); }
    .username { color: var(--K); font-size: 14px; font-weight: 800; letter-spacing: 0.02em; }
    .fullname { color: rgba(10, 10, 10, 0.5); font-size: 12px; font-weight: 600; margin-top: 1px; }
    .email-cell { color: var(--K); font-size: 13px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
    .date-cell { color: rgba(10, 10, 10, 0.6); font-size: 13px; font-weight: 600; }

    /* ===== BADGES ===== */
    .role-badge { background: var(--O); color: var(--K); border: 2px solid var(--K); padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; display: inline-flex; box-shadow: 2px 2px 0 var(--K); }
    .role-badge.admin { background: var(--B); color: var(--W); }
    .role-badge.dev { background: var(--Y); color: var(--K); }
    .provider-badge { background: var(--O); color: var(--K); border: 2px solid var(--K); padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; display: inline-flex; box-shadow: 2px 2px 0 var(--K); }
    .provider-badge.github { background: var(--K); color: var(--W); }
    .status-badge { border: 2px solid var(--K); padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; background: rgba(239,68,68,0.15); color: var(--R); display: inline-flex; box-shadow: 2px 2px 0 var(--K); }
    .status-badge.active { background: rgba(0,200,83,0.15); color: var(--K); }

    /* ===== ACTION BUTTONS ===== */
    .action-btns { display: flex; gap: 8px; }
    .btn-neo { border: 2px solid var(--K); padding: 6px 14px; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 3px 3px 0 var(--K); }
    .btn-neo:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--K); }
    .btn-neo:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--K); }
    .btn-react { background: var(--G); color: var(--K); }
    .btn-del { background: var(--R); color: var(--W); }

    /* ===== EMPTY STATE ===== */
    .empty-row { text-align: center; padding: 60px 20px !important; background: var(--O) !important; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; color: rgba(10,10,10,0.5); font-weight: 700; font-size: 14px; }
    .empty-icon { font-size: 36px; opacity: 0.4; }

    /* ===== MODAL ===== */
    .modal-overlay { position: fixed; inset: 0; background: rgba(10, 10, 10, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: var(--W); border: 4px solid var(--K); padding: 36px; max-width: 460px; width: 90%; box-shadow: 12px 12px 0 var(--K); animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes modal-pop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .modal-icon { font-size: 48px; margin-bottom: 12px; }
    .modal h3 { color: var(--K); margin: 0 0 12px; font-size: 28px; letter-spacing: 0.04em; }
    .modal p { color: var(--K); font-size: 15px; line-height: 1.6; font-weight: 500; margin: 0 0 24px; }
    .modal strong { color: var(--R); font-weight: 800; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .btn-cancel { background: var(--W); border: 3px solid var(--K); padding: 10px 22px; color: var(--K); font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; text-transform: uppercase; cursor: pointer; box-shadow: 4px 4px 0 var(--K); transition: transform 0.1s, box-shadow 0.1s; }
    .btn-cancel:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--K); }
    .btn-cancel:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 var(--K); }
    .btn-confirm-del { background: var(--R); border: 3px solid var(--K); padding: 10px 22px; color: var(--W); font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; text-transform: uppercase; cursor: pointer; box-shadow: 4px 4px 0 var(--K); transition: transform 0.1s, box-shadow 0.1s; }
    .btn-confirm-del:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--K); }
    .btn-confirm-del:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 var(--K); }

    /* ===== RESPONSIVE ===== */
    @media(max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .admin { padding: 20px 16px; } h1 { font-size: 36px; } }
    @media(max-width: 480px) { .stats-grid { grid-template-columns: 1fr 1fr; } .toolbar { flex-direction: column; } .search-wrap { min-width: 100%; } }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('page') pageRef!: ElementRef;
  @ViewChild('header') headerRef!: ElementRef;
  @ViewChild('pills') pillsRef!: ElementRef;
  @ViewChild('table') tableRef!: ElementRef;

  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  users: User[] = [];
  filtered: User[] = [];
  search = '';
  filterRole = '';
  filterStatus = '';
  userToDelete: User | null = null;
  today = new Date();

  get activeCount(): number { return this.users.filter(u => u.isActive).length; }
  get adminCount(): number { return this.users.filter(u => u.role === 'ADMINISTRATOR').length; }

  ngOnInit(): void {
    this.authSvc.adminGetAllUsers().subscribe(users => {
      this.users = users;
      this.applyFilters();
    });
  }

  ngAfterViewInit(): void {
    if (!this.headerRef?.nativeElement) return;
    const tl = gsap.timeline();
    tl.fromTo(this.headerRef.nativeElement,
        { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    if (this.pillsRef?.nativeElement) {
      tl.fromTo(this.pillsRef.nativeElement.querySelectorAll('.sc'),
        { y: 40, opacity: 0, rotation: 3 },
        { y: 0, opacity: 1, rotation: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' }, '-=0.1');
    }
    tl.fromTo('.sec-row',
      { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.1')
    .fromTo('.toolbar',
      { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.1');
    if (this.tableRef?.nativeElement) {
      tl.fromTo(this.tableRef.nativeElement,
        { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.1');
    }
  }

  applyFilters(): void {
    this.filtered = this.users.filter(u => {
      const matchSearch = !this.search ||
        u.username.toLowerCase().includes(this.search.toLowerCase()) ||
        u.email.toLowerCase().includes(this.search.toLowerCase()) ||
        (u.fullName || '').toLowerCase().includes(this.search.toLowerCase());
      const matchRole = !this.filterRole || u.role === this.filterRole;
      const matchStatus = !this.filterStatus ||
        (this.filterStatus === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }

  reactivate(userId: number): void {
    this.authSvc.adminReactivate(userId).subscribe(() => {
      this.users = this.users.map(u => u.userId === userId ? { ...u, isActive: true } : u);
      this.applyFilters();
      this.toast.success('User reactivated');
    });
  }

  confirmDelete(u: User): void { this.userToDelete = u; }

  deleteUser(): void {
    if (!this.userToDelete) return;
    this.authSvc.adminDeleteUser(this.userToDelete.userId).subscribe(() => {
      this.users = this.users.filter(u => u.userId !== this.userToDelete!.userId);
      this.applyFilters();
      this.toast.success('User deleted');
      this.userToDelete = null;
    });
  }

  getAvatarColor(name: string): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#3b82f6'];
    return colors[name.charCodeAt(0) % colors.length];
  }
}

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
    <div class="page" #page>
      <div class="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p class="subtitle">Manage all users and platform data</p>
        </div>
        <div class="stat-pills" #pills>
          <div class="pill">
            <span class="pill-val">{{ users.length }}</span>
            <span class="pill-label">Total Users</span>
          </div>
          <div class="pill">
            <span class="pill-val">{{ activeCount }}</span>
            <span class="pill-label">Active</span>
          </div>
          <div class="pill inactive">
            <span class="pill-val">{{ users.length - activeCount }}</span>
            <span class="pill-label">Inactive</span>
          </div>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="toolbar">
        <input [(ngModel)]="search" (input)="applyFilters()" placeholder="Search by name, email, username…" class="search-input" />
        <select [(ngModel)]="filterRole" (change)="applyFilters()" class="filter-select">
          <option value="">All roles</option>
          <option value="GUEST">GUEST</option>
          <option value="DEVELOPER">DEVELOPER</option>
          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
        </select>
        <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="filter-select">
          <option value="">All status</option>
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
            <tr *ngFor="let u of filtered" [class.inactive-row]="!u.isActive">
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
                <span class="role-badge" [class.admin]="u.role === 'ADMINISTRATOR'">{{ u.role }}</span>
              </td>
              <td>
                <span class="provider-badge">{{ u.provider }}</span>
              </td>
              <td>
                <span class="status-badge" [class.active]="u.isActive">
                  {{ u.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="date-cell">{{ u.createdAt | date:'mediumDate' }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-sm btn-success" *ngIf="!u.isActive" (click)="reactivate(u.userId)">Reactivate</button>
                  <button class="btn-sm btn-danger" (click)="confirmDelete(u)">Delete</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!filtered.length">
              <td colspan="7" class="empty-row">No users match the current filters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Delete Confirm Modal -->
      <div class="modal-overlay" *ngIf="userToDelete" (click)="userToDelete = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Delete User?</h3>
          <p>Are you sure you want to permanently delete <strong>{{ userToDelete.username }}</strong>?
             This cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-outline" (click)="userToDelete = null">Cancel</button>
            <button class="btn-danger-solid" (click)="deleteUser()">Delete Permanently</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1300px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { color: #fff; font-size: 28px; margin: 0 0 4px; }
    .subtitle { color: rgba(255,255,255,0.4); font-size: 14px; margin: 0; }
    .stat-pills { display: flex; gap: 12px; }
    .pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 14px 20px; text-align: center; min-width: 90px; }
    .pill.inactive { border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05); }
    .pill-val { color: #fff; font-size: 24px; font-weight: 700; display: block; }
    .pill-label { color: rgba(255,255,255,0.4); font-size: 12px; }
    .toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 240px; background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 16px;
      color: #fff; font-size: 14px; outline: none; }
    .filter-select { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px; padding: 10px 14px; color: rgba(255,255,255,0.7); font-size: 14px;
      outline: none; cursor: pointer; }
    .filter-select option { background: #1e1e30; }
    .table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; overflow: hidden; overflow-x: auto; }
    .user-table { width: 100%; border-collapse: collapse; }
    .user-table th { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5);
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 14px 16px; text-align: left; }
    .user-table td { padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.05);
      vertical-align: middle; }
    .inactive-row td { opacity: 0.55; }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; color: #fff; font-weight: 700; font-size: 15px; flex-shrink: 0; }
    .username { color: #e2e8f0; font-size: 14px; font-weight: 500; }
    .fullname { color: rgba(255,255,255,0.4); font-size: 12px; }
    .email-cell { color: rgba(255,255,255,0.6); font-size: 13px; }
    .date-cell { color: rgba(255,255,255,0.4); font-size: 13px; }
    .role-badge { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
      border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
    .role-badge.admin { background: rgba(99,102,241,0.2); color: #818cf8; }
    .provider-badge { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
      border-radius: 6px; padding: 3px 10px; font-size: 12px; }
    .status-badge { border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 600;
      background: rgba(239,68,68,0.15); color: #f87171; }
    .status-badge.active { background: rgba(34,197,94,0.15); color: #4ade80; }
    .action-btns { display: flex; gap: 6px; }
    .btn-sm { border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px;
      font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .btn-sm:hover { opacity: 0.8; }
    .btn-success { background: rgba(34,197,94,0.15); color: #4ade80; }
    .btn-danger { background: rgba(239,68,68,0.12); color: #f87171; }
    .empty-row { text-align: center; color: rgba(255,255,255,0.3); padding: 32px !important; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex;
      align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #1a1a2e; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px;
      padding: 32px; max-width: 420px; width: 100%; }
    .modal h3 { color: #fff; margin: 0 0 12px; font-size: 20px; }
    .modal p { color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; }
    .modal strong { color: #fff; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
    .btn-outline { background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;
      padding: 10px 20px; color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer; }
    .btn-danger-solid { background: #ef4444; border: none; border-radius: 8px;
      padding: 10px 20px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('page') pageRef!: ElementRef;
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

  get activeCount(): number { return this.users.filter(u => u.isActive).length; }

  ngOnInit(): void {
    this.authSvc.adminGetAllUsers().subscribe(users => {
      this.users = users;
      this.applyFilters();
    });
  }

  ngAfterViewInit(): void {
    const tl = gsap.timeline();
    tl.fromTo(this.pageRef.nativeElement.querySelector('.page-header'),
      { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
      .fromTo(this.pillsRef.nativeElement.querySelectorAll('.pill'),
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, stagger: 0.07, ease: 'back.out(1.7)' }, '-=0.2')
      .fromTo(this.tableRef.nativeElement,
        { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.1');
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

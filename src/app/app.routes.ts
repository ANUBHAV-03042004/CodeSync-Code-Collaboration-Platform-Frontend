import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { HomeComponent } from './features/home/home';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EditorComponent } from './features/editor/editor.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import {
  Oauth2CallbackComponent,
  ForgotPasswordComponent,
  ResetPasswordComponent
} from './features/auth/auth-extra.component';
import {
  ProjectListComponent,
  ProjectCreateComponent,
  ProjectDetailComponent
} from './features/projects/projects.component';

export const routes: Routes = [
  // ── Landing (default at localhost:4200) ───────────────────────────────────
  { path: '',    component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // ── Public ───────────────────────────────────────────────────────────────
  { path: 'login',           component: LoginComponent },
  { path: 'register',        component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password',  component: ResetPasswordComponent },
  { path: 'oauth2/callback', component: Oauth2CallbackComponent },

  // ── Protected ─────────────────────────────────────────────────────────────
  { path: 'dashboard',         component: DashboardComponent,         canActivate: [authGuard] },
  { path: 'projects',          component: ProjectListComponent,        canActivate: [authGuard] },
  { path: 'projects/new',      component: ProjectCreateComponent,      canActivate: [authGuard] },
  { path: 'projects/:id',      component: ProjectDetailComponent,      canActivate: [authGuard] },
  { path: 'editor/:projectId', component: EditorComponent,             canActivate: [authGuard] },
  { path: 'notifications',     component: NotificationsComponent,      canActivate: [authGuard] },

  // ── Admin-only ────────────────────────────────────────────────────────────
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard] },

  // ── Wildcard ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];

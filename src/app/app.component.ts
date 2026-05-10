import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar *ngIf="showNav"></app-navbar>
    <main class="app-main" [class.with-nav]="showNav">
      <router-outlet></router-outlet>
    </main>
    <app-toast></app-toast>
  `,
  styles: [`:host { display: block; min-height: 100vh; background: #FFFFF0; }
    .app-main { min-height: 100vh; }
    .app-main.with-nav { min-height: calc(100vh - 64px); }`]
})
export class AppComponent implements OnInit {
  showNav = true;
  private noNavRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth2/callback'];
  constructor(private router: Router) {}
  ngOnInit(): void {
    console.log('AppComponent initialized. API Base:', environment.apiBase);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        console.log('NavigationEnd:', e.urlAfterRedirects);
        this.showNav = !this.noNavRoutes.some(r => e.urlAfterRedirects.startsWith(r));
      });
  }
}
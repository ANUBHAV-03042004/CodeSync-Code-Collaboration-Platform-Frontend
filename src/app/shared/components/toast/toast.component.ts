import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from './toast.service';

interface ToastItem extends Toast { id: number; }

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div class="toast" *ngFor="let t of toasts; trackBy: trackById"
           [class]="'toast-' + t.type" [attr.data-id]="t.id">
        <span class="toast-icon">{{ iconFor(t.type) }}</span>
        <span class="toast-msg">{{ t.message }}</span>
        <button class="toast-close" (click)="remove(t.id)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container { position:fixed;top:80px;right:24px;display:flex;flex-direction:column;gap:10px;z-index:9998;pointer-events:none; }
    .toast { display:flex;align-items:center;gap:10px;padding:13px 18px;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.05em;border:3px solid #0A0A0A;box-shadow:5px 5px 0 #0A0A0A;pointer-events:auto;max-width:320px;font-family:'Space Grotesk',sans-serif; }
    .toast-success { background:#00C853;color:#0A0A0A; }
    .toast-error   { background:#FF2D2D;color:#FFFFF0; }
    .toast-info    { background:#1A6FFF;color:#FFFFF0; }
    .toast-warn    { background:#FFD600;color:#0A0A0A; }
    .toast-icon { font-size:16px;flex-shrink:0; }
    .toast-msg { flex:1;line-height:1.3; }
    .toast-close { background:none;border:none;cursor:pointer;font-size:14px;font-weight:900;padding:0 2px;opacity:.7; }
    .toast-close:hover { opacity:1; }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  private toastSvc = inject(ToastService);
  toasts: ToastItem[] = [];
  private counter = 0;
  private sub!: Subscription;

  ngOnInit(): void { this.sub = this.toastSvc.toast$.subscribe(t => this.show(t)); }

  show(t: Toast): void {
    const item: ToastItem = { ...t, id: ++this.counter };
    this.toasts.push(item);
    setTimeout(() => {
      const el = document.querySelector(`.toast[data-id="${item.id}"]`);
      if (el) gsap.fromTo(el, { x: 400, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'back.out(1.5)' });
    }, 10);
    setTimeout(() => this.remove(item.id), 3500);
  }

  remove(id: number): void {
    const el = document.querySelector(`.toast[data-id="${id}"]`);
    if (el) {
      gsap.to(el, { x: 400, opacity: 0, duration: .25, ease: 'power2.in',
        onComplete: () => { this.toasts = this.toasts.filter(t => t.id !== id); }});
    } else {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }
  }

  iconFor(type: string): string {
    return { success: '✔', error: '✖', info: '⚡', warn: '⚠' }[type] || '!';
  }
  trackById(_: number, t: ToastItem): number { return t.id; }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
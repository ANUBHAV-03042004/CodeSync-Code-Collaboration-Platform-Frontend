import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast { message: string; type: 'success' | 'error' | 'info' | 'warn'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast$ = new Subject<Toast>();
  success(message: string) { this.toast$.next({ message, type: 'success' }); }
  error(message: string)   { this.toast$.next({ message, type: 'error' }); }
  info(message: string)    { this.toast$.next({ message, type: 'info' }); }
  warn(message: string)    { this.toast$.next({ message, type: 'warn' }); }
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
// ToastService: Angular service dispatching reactive pop-up notification messages to the UI.
//

export interface Toast { message: string; type: 'success' | 'error' | 'info' | 'warn'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast$ = new Subject<Toast>();
  success(message: string) { this.toast$.next({ message, type: 'success' }); }
  error(message: string)   { this.toast$.next({ message, type: 'error' }); }
  info(message: string)    { this.toast$.next({ message, type: 'info' }); }
  warn(message: string)    { this.toast$.next({ message, type: 'warn' }); }
}
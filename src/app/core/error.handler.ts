import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { ToastService } from '../shared/components/toast/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private toast: ToastService, private zone: NgZone) {}

  handleError(error: any): void {
    console.error('Global Error:', error);
    
    // Check for common boot-time failures
    const errorStr = String(error);
    if (errorStr.includes('%%ANGULAR_API_BASE%%')) {
      this.zone.run(() => {
        this.toast.error('Environment variables not substituted! Check Netlify configuration.');
      });
      return;
    }

    // Don't spam the user for minor errors, but log them
    if (errorStr.includes('ExpressionChangedAfterItHasBeenCheckedError')) {
      return;
    }

    this.zone.run(() => {
      this.toast.error('An unexpected error occurred. Please refresh or try again later.');
    });
  }
}

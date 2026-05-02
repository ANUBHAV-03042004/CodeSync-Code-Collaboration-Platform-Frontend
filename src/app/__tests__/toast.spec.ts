import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { ToastService, Toast } from '../shared/components/toast/toast.service';

// Mock GSAP so tests don't need a DOM renderer
jest.mock('gsap', () => ({
  gsap: { fromTo: jest.fn(), to: jest.fn() },
  fromTo: jest.fn(),
  to: jest.fn()
}));

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastSubject: Subject<Toast>;
  let toastSvc: any;

  beforeEach(async () => {
    toastSubject = new Subject<Toast>();
    toastSvc = { toast$: toastSubject };

    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: ToastService, useValue: toastSvc }]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should start with empty toasts', () => {
    expect(component.toasts).toHaveLength(0);
  });

  it('should add a toast when service emits', () => {
    toastSubject.next({ message: 'Hello!', type: 'success' });
    expect(component.toasts).toHaveLength(1);
    expect(component.toasts[0].message).toBe('Hello!');
    expect(component.toasts[0].type).toBe('success');
  });

  it('should assign incremented id to each toast', () => {
    toastSubject.next({ message: 'First', type: 'info' });
    toastSubject.next({ message: 'Second', type: 'error' });
    expect(component.toasts[0].id).toBe(1);
    expect(component.toasts[1].id).toBe(2);
  });

  it('should remove toast by id', () => {
    toastSubject.next({ message: 'Hello', type: 'warn' });
    const id = component.toasts[0].id;
    component.remove(id);
    expect(component.toasts.find(t => t.id === id)).toBeUndefined();
  });

  it('should not throw when removing nonexistent id', () => {
    expect(() => component.remove(9999)).not.toThrow();
  });

  it('should return correct icons', () => {
    expect(component.iconFor('success')).toBe('✅');
    expect(component.iconFor('error')).toBe('❌');
    expect(component.iconFor('info')).toBe('ℹ️');
    expect(component.iconFor('warn')).toBe('⚠️');
    expect(component.iconFor('unknown')).toBe('🔔');
  });

  it('should trackBy id', () => {
    const toast = { id: 5, message: 'x', type: 'info' as const };
    expect(component.trackById(0, toast)).toBe(5);
  });

  it('should auto-remove toast after 4 seconds', fakeAsync(() => {
    toastSubject.next({ message: 'Auto-remove', type: 'success' });
    expect(component.toasts).toHaveLength(1);
    tick(4000);
    expect(component.toasts).toHaveLength(0);
  }));

  it('should handle multiple toasts', () => {
    ['success', 'error', 'info', 'warn'].forEach((type, i) => {
      toastSubject.next({ message: `Toast ${i}`, type: type as any });
    });
    expect(component.toasts).toHaveLength(4);
  });
});

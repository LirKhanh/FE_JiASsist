import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div *ngFor="let notification of notifications" 
           class="notification-toast" 
           [ngClass]="notification.type"
           (click)="removeNotification(notification.id)">
        <div class="notification-icon">
          <span *ngIf="notification.type === 'success'">✓</span>
          <span *ngIf="notification.type === 'error'">✕</span>
          <span *ngIf="notification.type === 'info'">ℹ</span>
          <span *ngIf="notification.type === 'warning'">⚠</span>
        </div>
        <div class="notification-message">
          {{ notification.message }}
        </div>
        <div class="notification-close">×</div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    .notification-toast {
      pointer-events: auto;
      min-width: 300px;
      max-width: 450px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      padding: 16px;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      border-left: 6px solid #ccc;
      transition: all 0.2s ease;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .notification-toast:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .notification-toast.success { border-left-color: #4caf50; }
    .notification-toast.error { border-left-color: #f44336; }
    .notification-toast.info { border-left-color: #2196f3; }
    .notification-toast.warning { border-left-color: #ff9800; }

    .notification-icon {
      margin-right: 12px;
      font-weight: bold;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }

    .success .notification-icon { color: #4caf50; background: #e8f5e9; }
    .error .notification-icon { color: #f44336; background: #ffebee; }
    .info .notification-icon { color: #2196f3; background: #e3f2fd; }
    .warning .notification-icon { color: #ff9800; background: #fff3e0; }

    .notification-message {
      flex: 1;
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    .notification-close {
      margin-left: 12px;
      font-size: 20px;
      color: #999;
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
        this.cdr.detectChanges();
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  removeNotification(id: number) {
    this.notificationService.remove(id);
  }
}

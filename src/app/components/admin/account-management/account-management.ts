import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Quản trị tài khoản</h2>
    <p>Nội dung quản lý tài khoản người dùng sẽ hiển thị ở đây.</p>
  `
})
export class AccountManagementComponent {}

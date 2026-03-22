import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Quản trị vai trò</h2>
    <p>Nội dung quản lý các vai trò người dùng (Admin, User, Manager, etc.) sẽ hiển thị ở đây.</p>
  `
})
export class RoleManagementComponent {}

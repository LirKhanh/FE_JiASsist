import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Quản trị dự án</h2>
    <p>Nội dung quản lý các dự án trong hệ thống sẽ hiển thị ở đây.</p>
  `
})
export class ProjectManagementComponent {}

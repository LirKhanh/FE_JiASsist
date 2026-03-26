import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-text-primary">Quản trị vai trò</h2>
          <p class="text-text-secondary mt-1">Định nghĩa các vai trò và phân quyền chức năng trong hệ thống.</p>
        </div>
        <button class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm vai trò
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <div class="flex justify-between items-start mb-4">
            <h3 class="font-bold text-text-primary text-lg">Administrator</h3>
            <span class="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">System</span>
          </div>
          <p class="text-sm text-text-secondary mb-6">Toàn quyền truy cập và cấu hình tất cả các tính năng của hệ thống JiASsist.</p>
          <div class="flex justify-between items-center pt-4 border-t border-gray-50">
            <span class="text-xs font-semibold text-text-secondary">1 người dùng</span>
            <button class="text-primary hover:underline font-bold text-xs">Phân quyền</button>
          </div>
        </div>
        
        <div class="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <div class="flex justify-between items-start mb-4">
            <h3 class="font-bold text-text-primary text-lg">Project Manager</h3>
            <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Management</span>
          </div>
          <p class="text-sm text-text-secondary mb-6">Quản lý dự án, phân công công việc và theo dõi tiến độ của các thành viên.</p>
          <div class="flex justify-between items-center pt-4 border-t border-gray-50">
            <span class="text-xs font-semibold text-text-secondary">5 người dùng</span>
            <button class="text-primary hover:underline font-bold text-xs">Phân quyền</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RoleManagementComponent {}

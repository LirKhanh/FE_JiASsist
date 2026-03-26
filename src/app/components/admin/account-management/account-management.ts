import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-text-primary">Quản trị tài khoản</h2>
          <p class="text-text-secondary mt-1">Quản lý và cấp quyền truy cập cho nhân viên trong hệ thống.</p>
        </div>
        <button class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm tài khoản
        </button>
      </div>

      <div class="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
        <div class="p-4 bg-gray-50 border-b border-border flex space-x-4">
          <input type="text" placeholder="Tìm kiếm tài khoản..." class="flex-grow px-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
          <select class="px-4 py-2 border border-border rounded-lg text-sm bg-white outline-none">
            <option>Tất cả vai trò</option>
            <option>Administrator</option>
            <option>Project Manager</option>
            <option>Developer</option>
          </select>
        </div>
        
        <table class="w-full text-left">
          <thead class="bg-gray-50/50 text-text-secondary uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th class="px-6 py-4">Tên người dùng</th>
              <th class="px-6 py-4">Email</th>
              <th class="px-6 py-4">Vai trò</th>
              <th class="px-6 py-4">Trạng thái</th>
              <th class="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 text-xs">A</div>
                  <span class="font-bold text-text-primary">admin</span>
                </div>
              </td>
              <td class="px-6 py-4 text-text-secondary">admin@jiassist.com</td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 border border-purple-200">Administrator</span>
              </td>
              <td class="px-6 py-4">
                <span class="flex items-center text-xs text-green-600 font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                  Hoạt động
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="text-primary hover:text-primary-hover font-bold text-xs p-2">Chỉnh sửa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AccountManagementComponent {}

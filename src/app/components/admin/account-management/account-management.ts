import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService, Account } from '../../../services/account.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-backdrop {
      animation: fadeIn 0.2s ease-out forwards;
    }
    .animate-modal {
      animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-text-primary">Quản trị Tài khoản</h2>
          <p class="text-text-secondary mt-1">Quản lý người dùng, phân quyền và trạng thái hoạt động trong hệ thống.</p>
        </div>
        <button (click)="openModal()" class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm tài khoản mới
        </button>
      </div>

      <!-- Bảng danh sách tài khoản -->
      <div class="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">ID Người dùng</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Tên Đăng nhập</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Họ và Tên</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Email</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Vai trò</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Trạng thái</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr *ngIf="accounts.length === 0" class="hover:bg-gray-50/50 transition-colors">
                <td colspan="7" class="px-6 py-10 text-center text-text-secondary">
                  {{ isLoading ? 'Đang tải dữ liệu tài khoản...' : 'Không có dữ liệu tài khoản.' }}
                </td>
              </tr>
              <tr *ngFor="let account of accounts" (click)="editAccount(account)" class="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td class="px-6 py-4 text-sm font-bold text-primary">{{ account.userId }}</td>
                <td class="px-6 py-4 text-sm font-medium text-text-primary">{{ account.username }}</td>
                <td class="px-6 py-4 text-sm text-text-secondary">{{ account.fullname }}</td>
                <td class="px-6 py-4 text-sm text-text-secondary">{{ account.email }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span *ngIf="account.adminYn" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">Admin</span>
                    <span *ngIf="account.pmYn" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700 border border-blue-200">PM</span>
                    <span *ngIf="!account.adminYn && !account.pmYn" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200">User</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span [class]="account.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" 
                        class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {{ account.status ? 'Hoạt động' : 'Khóa' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                   <button class="p-2 hover:bg-primary/10 rounded-full transition-all text-primary opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Thêm/Sửa Tài khoản -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity animate-backdrop" (click)="closeModal()"></div>

      <!-- Modal Container -->
      <div class="flex items-center justify-center min-h-screen p-4 text-center">
        <div class="inline-block align-middle bg-white rounded-xl text-left shadow-xl transform transition-all w-full max-w-2xl max-h-[90vh] border border-border animate-modal flex flex-col relative z-50">
          <!-- Header -->
          <div class="bg-white px-6 py-4 border-b border-border rounded-t-xl shrink-0">
            <h3 class="text-xl font-bold text-text-primary" id="modal-title">
              {{ isEditMode ? 'Cập Nhật Tài khoản' : 'Thêm Tài khoản Mới' }}
            </h3>
          </div>

          <!-- Body -->
          <div class="px-6 py-6 overflow-y-auto flex-grow">
            <div class="grid grid-cols-2 gap-4">
              <!-- User ID (Only show on Edit) -->
              <div *ngIf="isEditMode">
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">ID Người dùng</label>
                <input type="text" [(ngModel)]="currentAccount.userId" [disabled]="true" 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:bg-gray-100">
              </div>

              <!-- Username -->
              <div [class.col-span-2]="!isEditMode">
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Tên Đăng nhập</label>
                <input type="text" [(ngModel)]="currentAccount.username" [disabled]="isEditMode" placeholder="Nhập tên đăng nhập..." 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:bg-gray-100">
              </div>

              <!-- Password -->
              <div *ngIf="!isEditMode">
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Mật khẩu</label>
                <input type="password" [(ngModel)]="currentAccount.password" placeholder="Nhập mật khẩu..." 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium">
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Email</label>
                <input type="email" [(ngModel)]="currentAccount.email" placeholder="email@example.com" 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium">
              </div>

              <!-- Fullname -->
              <div class="col-span-2">
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Họ và Tên</label>
                <input type="text" [(ngModel)]="currentAccount.fullname" placeholder="Nhập họ và tên đầy đủ..." 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium">
              </div>

              <!-- Role Toggles -->
              <div class="flex gap-6 items-center">
                <div>
                    <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Admin</label>
                    <div class="flex items-center h-[42px]">
                        <button (click)="currentAccount.adminYn = !currentAccount.adminYn" 
                        [class]="currentAccount.adminYn ? 'bg-red-500' : 'bg-gray-300'"
                        class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-red-500/20">
                        <span [class]="currentAccount.adminYn ? 'translate-x-5' : 'translate-x-0'"
                            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">PM</label>
                    <div class="flex items-center h-[42px]">
                        <button (click)="currentAccount.pmYn = !currentAccount.pmYn" 
                        [class]="currentAccount.pmYn ? 'bg-blue-500' : 'bg-gray-300'"
                        class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500/20">
                        <span [class]="currentAccount.pmYn ? 'translate-x-5' : 'translate-x-0'"
                            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Trạng thái</label>
                    <div class="flex items-center h-[42px]">
                        <button (click)="currentAccount.status = !currentAccount.status" 
                        [class]="currentAccount.status ? 'bg-green-500' : 'bg-gray-300'"
                        class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-green-500/20">
                        <span [class]="currentAccount.status ? 'translate-x-5' : 'translate-x-0'"
                            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                        </button>
                    </div>
                </div>
              </div>

              <!-- Project Join (Multi-select) -->
              <div class="col-span-2 relative" [class.z-[60]]="isProjectDropdownOpen">
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Tham gia Dự án</label>
                <div (click)="isProjectDropdownOpen = !isProjectDropdownOpen" 
                     class="w-full px-4 py-2.5 rounded-lg border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary outline-none transition-all text-sm font-medium cursor-pointer bg-white flex justify-between items-center">
                  <span class="truncate">{{ getSelectedProjectNames() }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <div *ngIf="isProjectDropdownOpen" 
                     class="absolute left-0 right-0 z-[100] mt-1 bg-white border border-border rounded-lg shadow-2xl max-h-80 overflow-hidden flex flex-col">
                  <!-- Search Input -->
                  <div class="p-2 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <input type="text" [(ngModel)]="projectSearchTerm" placeholder="Tìm kiếm dự án..." 
                           class="w-full px-3 py-1.5 text-xs border border-border rounded-md outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                           (click)="$event.stopPropagation()">
                  </div>
                  
                  <!-- List items -->
                  <div class="overflow-y-scroll h-60">
                    <div *ngFor="let project of filteredProjects" 
                         (click)="toggleProject(project.project_id)"
                         class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <input type="checkbox" [checked]="isProjectSelected(project.project_id)" class="mr-3 h-4 w-4 text-primary border-border rounded focus:ring-primary/20">
                      <span class="text-sm font-medium text-text-primary">{{ project.project_name }}</span>
                      <span class="ml-2 text-xs text-text-secondary">({{ project.project_id }})</span>
                    </div>
                    <div *ngIf="filteredProjects.length === 0" class="px-4 py-3 text-sm text-text-secondary text-center italic">
                      {{ projectOptions.length === 0 ? 'Đang tải dữ liệu...' : 'Không tìm thấy dự án phù hợp.' }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Spacer to ensure dropdown has room within body scroll -->
              <div *ngIf="isProjectDropdownOpen" class="col-span-2 h-64"></div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-xl border-t border-border shrink-0">
            <button (click)="saveAccount()" [disabled]="isSaving"
              class="inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-primary text-base font-bold text-white hover:bg-primary-hover focus:outline-none sm:text-sm disabled:opacity-50 transition-all">
              {{ isSaving ? 'Đang lưu...' : 'Lưu Lại' }}
            </button>
            <button *ngIf="!isEditMode" (click)="saveAccount(true)" [disabled]="isSaving"
              class="inline-flex justify-center rounded-lg border border-primary shadow-sm px-6 py-2 bg-white text-base font-bold text-primary hover:bg-blue-50 focus:outline-none sm:text-sm transition-all">
              Lưu và Tiếp tục
            </button>
            <button (click)="closeModal()"
              class="inline-flex justify-center rounded-lg border border-border shadow-sm px-6 py-2 bg-white text-base font-bold text-text-primary hover:bg-gray-50 focus:outline-none sm:text-sm transition-all">
              Hủy Bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AccountManagementComponent implements OnInit {
  accounts: Account[] = [];
  projectOptions: any[] = [];
  isLoading: boolean = true;
  isSaving: boolean = false;
  isProjectDropdownOpen: boolean = false;
  projectSearchTerm: string = '';
  
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentAccount: Partial<Account> = {
    status: true,
    adminYn: false,
    pmYn: false,
    projectJoin: ''
  };

  constructor(
    private accountService: AccountService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadProjects();
  }

  get filteredProjects(): any[] {
    if (!this.projectSearchTerm) return this.projectOptions;
    const term = this.projectSearchTerm.toLowerCase();
    return this.projectOptions.filter(p => 
      p.project_name.toLowerCase().includes(term) || 
      p.project_id.toLowerCase().includes(term)
    );
  }

  loadData() {
    this.isLoading = true;
    this.accountService.getAccounts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.accounts = [...response.data];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notificationService.error('Lỗi khi tải danh sách tài khoản:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProjects() {
    const request = {
      queries: ["select project_id, project_name from projects"],
      keys: ["projects"]
    };
    
    this.accountService.loadComboboxData(request).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.projects) {
          this.projectOptions = response.data.projects;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.notificationService.error('Lỗi khi tải danh sách dự án:', error);
      }
    });
  }

  toggleProject(projectId: string) {
    let selectedProjects = this.currentAccount.projectJoin ? this.currentAccount.projectJoin.split(',').filter(p => p.trim() !== '') : [];
    const index = selectedProjects.indexOf(projectId);
    
    if (index > -1) {
      selectedProjects.splice(index, 1);
    } else {
      selectedProjects.push(projectId);
    }
    
    this.currentAccount.projectJoin = selectedProjects.join(',');
    this.cdr.detectChanges();
  }

  isProjectSelected(projectId: string): boolean {
    if (!this.currentAccount.projectJoin) return false;
    return this.currentAccount.projectJoin.split(',').includes(projectId);
  }

  getSelectedProjectNames(): string {
    if (!this.currentAccount.projectJoin) return 'Chọn dự án...';
    const ids = this.currentAccount.projectJoin.split(',');
    const names = this.projectOptions
      .filter(p => ids.includes(p.project_id))
      .map(p => p.project_name);
    return names.length > 0 ? names.join(', ') : 'Chọn dự án...';
  }

  openModal() {
    this.isEditMode = false;
    this.isProjectDropdownOpen = false;
    this.projectSearchTerm = '';
    this.currentAccount = {
      userId: '',
      username: '',
      password: '',
      email: '',
      fullname: '',
      projectJoin: '',
      status: true,
      adminYn: false,
      pmYn: false,
      createdAt: new Date(),
      createdBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
      actionType: 'A'
    };
    this.isModalOpen = true;
  }

  editAccount(account: Account) {
    this.isEditMode = true;
    this.isProjectDropdownOpen = false;
    this.projectSearchTerm = '';
    this.currentAccount = {
      ...account,
      updateAt: new Date(),
      updateBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
      actionType: 'E'
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveAccount(keepOpen: boolean = false) {
    if (!this.currentAccount.username || (!this.isEditMode && !this.currentAccount.password)) {
      this.notificationService.info('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }

    this.isSaving = true;
    this.accountService.saveAccount(this.currentAccount).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadData();
          this.notificationService.success(response.message || 'Thực hiện thành công!');
          if (keepOpen) {
            this.openModal();
          } else {
            this.closeModal();
          }
        } else {
          this.notificationService.error('Lỗi: ' + response.message);
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notificationService.error('Lỗi khi lưu tài khoản:', error);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}

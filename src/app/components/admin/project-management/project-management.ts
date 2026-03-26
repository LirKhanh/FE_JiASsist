import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project } from '../../../services/project.service';
import { BaseService } from '../../../services/base.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-project-management',
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
          <h2 class="text-2xl font-bold text-text-primary">Quản trị Dự án</h2>
          <p class="text-text-secondary mt-1">Theo dõi, chỉnh sửa và quản lý vòng đời của các dự án.</p>
        </div>
        <button (click)="openModal()" class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo dự án mới
        </button>
      </div>

      <!-- Bảng danh sách dự án -->
      <div class="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Mã Dự án</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Tên Dự án</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Quản lý (PM)</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Ngày Bắt đầu</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Ngày Kết thúc</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Trạng thái</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr *ngIf="projects.length === 0" class="hover:bg-gray-50/50 transition-colors">
                <td colspan="7" class="px-6 py-10 text-center text-text-secondary">
                  {{ isLoading ? 'Đang tải dữ liệu dự án...' : 'Không có dữ liệu dự án.' }}
                </td>
              </tr>
              <tr *ngFor="let project of projects" (click)="editProject(project)" class="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td class="px-6 py-4 text-sm font-bold text-primary">{{ project.projectId || project.projectId }}</td>
                <td class="px-6 py-4 text-sm font-medium text-text-primary">{{ project.projectName || project.projectName }}</td>
                <td class="px-6 py-4 text-sm text-text-secondary">{{ project.pmId || project.pmId }}</td>
                <td class="px-6 py-4 text-sm text-text-secondary">{{ (project.startDate || project.startDate) | date:'dd/MM/yyyy' }}</td>
                <td class="px-6 py-4 text-sm text-text-secondary">{{ (project.endDate || project.endDate) | date:'dd/MM/yyyy' }}</td>
                <td class="px-6 py-4">
                  <span [class]="(project.status !== undefined ? project.status : project.status) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" 
                        class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {{ (project.status !== undefined ? project.status : project.status) ? 'Hoạt động' : 'Tạm dừng' }}
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

    <!-- Modal Thêm/Sửa Dự án -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity animate-backdrop" aria-hidden="true" (click)="closeModal()"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-border animate-modal">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-xl leading-6 font-bold text-text-primary mb-6" id="modal-title">
              {{ isEditMode ? 'Cập Nhật Dự án' : 'Thêm Dự án Mới' }}
            </h3>
            
            <div class="space-y-4">
              <!-- Project ID -->
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Mã Dự án (ProjectId)</label>
                <input type="text" [(ngModel)]="currentProject.projectId" [disabled]="isEditMode" placeholder="VD: PROJ001" 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:bg-gray-100">
              </div>

              <!-- Project Name -->
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Tên Dự án (ProjectName)</label>
                <input type="text" [(ngModel)]="currentProject.projectName" placeholder="Nhập tên dự án..." 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium">
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Mô tả (Description)</label>
                <textarea [(ngModel)]="currentProject.description" rows="2" placeholder="Mô tả chi tiết dự án..." 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- PM ID Select -->
                <div>
                    <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Quản lý (PM)</label>
                    <select [(ngModel)]="currentProject.pmId" class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium bg-white">
                        <option value={{ (user.userId || user.UserId) }}>Chọn PM...</option>
                        <option *ngFor="let user of PmUsers" [value]="user.userId || user.UserId">
                          {{ (user.username || user.Username) }} - {{ (user.fullname || user.Fullname) }}
                        </option>
                    </select>
                </div>

                <!-- Status Toggle -->
                <div>
                    <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Trạng thái</label>
                    <div class="flex items-center h-[42px]">
                        <button (click)="currentProject.status = !currentProject.status" 
                        [class]="currentProject.status ? 'bg-primary' : 'bg-gray-300'"
                        class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary/20">
                        <span [class]="currentProject.status ? 'translate-x-5' : 'translate-x-0'"
                            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                        </button>
                        <span class="ml-3 text-sm font-medium" [class]="currentProject.status ? 'text-primary' : 'text-text-secondary'">
                        {{ currentProject.status ? 'Hoạt động' : 'Tạm dừng' }}
                        </span>
                    </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Start Date -->
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Ngày Bắt đầu</label>
                  <input type="date" [(ngModel)]="currentProject.startDate" 
                    class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium">
                </div>
                <!-- End Date -->
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Ngày Kết thúc</label>
                  <input type="date" [(ngModel)]="currentProject.endDate" 
                    class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium">
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <button (click)="saveProject()" [disabled]="isSaving"
              class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-primary text-base font-bold text-white hover:bg-primary-hover focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all">
              {{ isSaving ? 'Đang lưu...' : 'Lưu Lại' }}
            </button>
            <button (click)="closeModal()"
              class="mt-3 w-full inline-flex justify-center rounded-lg border border-border shadow-sm px-6 py-2 bg-white text-base font-bold text-text-primary hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all">
              Hủy Bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProjectManagementComponent implements OnInit {
  projects: Project[] = [];
  PmUsers: any[] = [];
  isLoading: boolean = true;
  isSaving: boolean = false;
  
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentProject: Partial<Project> = {
    status: true
  };

  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private baseService: BaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadPMUsers();
  }

  loadData() {
    this.isLoading = true;
    this.projectService.getProjects().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.projects = [...response.data];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notificationService.error('Error fetching projects:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPMUsers() {
    const request = {
      queries: ["select * from users where role_id = 'PM'"],
      keys: ["users"]
    };
    
    this.baseService.loadComboboxData(request).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.users) {
          this.PmUsers = response.data.users;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.notificationService.error('Error fetching admin users:', error);
      }
    });
  }

  openModal() {
    this.isEditMode = false;
    this.currentProject = {
      projectId: '',
      projectName: '',
      description: '',
      pmId: '',
      startDate: '',
      endDate: '',
      status: true,
      createdAt: new Date(),
      createdBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
      actionType:'A'
    };
    this.isModalOpen = true;
  }

  editProject(project: any) {
    this.isEditMode = true;
    this.currentProject = {
      projectId: project.projectId || project.ProjectId,
      projectName: project.projectName || project.ProjectName,
      description: project.description || project.Description,
      pmId: project.pmId || project.PmId,
      startDate: this.formatDate(project.startDate || project.StartDate),
      endDate: this.formatDate(project.endDate || project.EndDate),
      status: project.status !== undefined ? project.status : project.Status,
      updateAt: new Date(),
      updateBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
      actionType:'E'

    };
    this.isModalOpen = true;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveProject() {
    if (!this.currentProject.projectId || !this.currentProject.projectName) {
      this.notificationService.info('Vui lòng nhập đầy đủ Mã và Tên dự án!');
      return;
    }

    this.isSaving = true;
    this.projectService.saveProject(this.currentProject).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadData();
          this.notificationService.success(response.message || 'Thực hiện thành công!');
          this.closeModal();
        } else {
          this.notificationService.error('Lỗi: ' + response.message);
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notificationService.error('Error saving project:', error);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}

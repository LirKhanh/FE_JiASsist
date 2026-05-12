import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService, Filter } from '../../../services/filter.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-filter-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
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
          <h2 class="text-2xl font-bold text-text-primary">Quản trị Bộ lọc (Filters)</h2>
          <p class="text-text-secondary mt-1">Quản lý các điều kiện lọc dữ liệu hệ thống và tùy chỉnh.</p>
        </div>
        <button (click)="openModal()" class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm bộ lọc mới
        </button>
      </div>

      <!-- Bảng danh sách bộ lọc -->
      <div class="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Mã Bộ lọc</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Loại</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Câu lệnh SQL</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr *ngIf="paginatedFilters.length === 0" class="hover:bg-gray-50/50 transition-colors">
                <td colspan="4" class="px-6 py-10 text-center text-text-secondary">
                  {{ isLoading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu bộ lọc.' }}
                </td>
              </tr>
              <tr *ngFor="let filter of paginatedFilters" (click)="editFilter(filter)" class="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td class="px-6 py-4 text-sm font-bold text-primary">{{ filter.filterId }}</td>
                <td class="px-6 py-4">
                  <span [class]="filter.type === 'system' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'" 
                        class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border">
                    {{ filter.type }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-text-secondary truncate max-w-xs font-mono">{{ filter.strSql }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center space-x-2">
                    <button class="p-2 hover:bg-primary/10 rounded-full transition-all text-primary opacity-0 group-hover:opacity-100" (click)="$event.stopPropagation(); editFilter(filter)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button class="p-2 hover:bg-red-100 rounded-full transition-all text-red-600 opacity-0 group-hover:opacity-100" (click)="$event.stopPropagation(); deleteFilter(filter.filterId!)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <app-pagination 
          *ngIf="filters.length > 0"
          [totalItems]="filters.length"
          [pageSize]="pageSize"
          [currentPage]="currentPage"
          (pageChange)="onPageChange($event)">
        </app-pagination>
      </div>
    </div>

    <!-- Modal Thêm/Sửa Bộ lọc -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity animate-backdrop" (click)="closeModal()"></div>

      <div class="flex items-center justify-center min-h-screen p-4 text-center">
        <div class="inline-block align-middle bg-white rounded-xl text-left shadow-xl transform transition-all w-full max-w-2xl max-h-[90vh] border border-border animate-modal flex flex-col relative z-50">
          <div class="bg-white px-6 py-4 border-b border-border rounded-t-xl shrink-0">
            <h3 class="text-xl font-bold text-text-primary" id="modal-title">
              {{ isEditMode ? 'Cập Nhật Bộ lọc' : 'Thêm Bộ lọc Mới' }}
            </h3>
          </div>

          <div class="px-6 py-6 overflow-y-auto flex-grow">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Mã Bộ lọc</label>
                <input type="text" [(ngModel)]="currentFilter.filterId" [disabled]="isEditMode" placeholder="Nhập mã bộ lọc (VD: F_MY_TASKS)..." 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:bg-gray-100">
              </div>

              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Loại (Type)</label>
                <select [(ngModel)]="currentFilter.type" 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium bg-white">
                  <option value="system">System</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Câu lệnh SQL (strsql)</label>
                <textarea [(ngModel)]="currentFilter.strSql" rows="6" placeholder="Nhập câu lệnh SQL lọc dữ liệu..." 
                  class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono"></textarea>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-xl border-t border-border shrink-0">
            <button (click)="saveFilter()" [disabled]="isSaving"
              class="inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-primary text-base font-bold text-white hover:bg-primary-hover focus:outline-none sm:text-sm disabled:opacity-50 transition-all">
              {{ isSaving ? 'Đang lưu...' : 'Lưu Lại' }}
            </button>
            <button (click)="closeModal()"
              class="inline-flex justify-center rounded-lg border border-border shadow-sm px-6 py-2 bg-white text-base font-bold text-text-primary hover:bg-gray-50 focus:outline-none sm:text-sm transition-all">
              Hủy Bỏ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Xác nhận xóa -->
    <div *ngIf="isDeleteModalOpen" class="fixed inset-0 z-[110] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div (click)="isDeleteModalOpen = false" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-border">
          <div class="bg-white px-6 pt-5 pb-4 sm:p-8 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-bold text-text-primary" id="modal-title">
                  Xác nhận xóa bộ lọc
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-text-secondary">
                    Bạn có chắc chắn muốn xóa bộ lọc <strong>{{ deleteFilterId }}</strong> không? Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3">
            <button type="button" (click)="confirmDeleteFilter()"
              class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2 bg-red-600 text-sm font-bold text-white hover:bg-red-700 focus:outline-none sm:w-auto transition-all">
              Xác nhận xóa
            </button>
            <button type="button" (click)="isDeleteModalOpen = false"
              class="mt-3 w-full inline-flex justify-center rounded-lg border border-border shadow-sm px-5 py-2 bg-white text-sm font-bold text-text-primary hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto transition-all">
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FilterManagementComponent implements OnInit {
  filters: Filter[] = [];
  isLoading: boolean = true;
  isSaving: boolean = false;
  
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentFilter: Partial<Filter> = {
    type: 'system',
    strSql: ''
  };

  isDeleteModalOpen: boolean = false;
  deleteFilterId: string | null = null;

  currentPage: number = 1;
  pageSize: number = 10;

  get paginatedFilters(): Filter[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filters.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  constructor(
    private filterService: FilterService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.filterService.getFilters().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.filters = [...response.data];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notificationService.error('Lỗi khi tải danh sách bộ lọc:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    this.isEditMode = false;
    this.currentFilter = {
      filterId: '',
      type: 'system', // Default to system as requested
      strSql: '',
      actionType: 'A'
    };
    this.isModalOpen = true;
  }

  editFilter(filter: Filter) {
    this.isEditMode = true;
    this.currentFilter = {
      ...filter,
      actionType: 'E'
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  saveFilter() {
    if (!this.currentFilter.filterId || !this.currentFilter.strSql) {
      this.notificationService.info('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }

    this.isSaving = true;
    
    // Create a copy to modify without affecting the UI bindings
    const dataToSave = { ...this.currentFilter };
    
    if (dataToSave.type === 'custom') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.userId || 'JiASsist';
      dataToSave.type = `${userId}-${this.generateRandomString(20)}`;
    }

    this.filterService.saveFilter(dataToSave).subscribe({
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
        this.notificationService.error('Lỗi khi lưu bộ lọc:', error);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteFilter(filterId: string) {
    this.deleteFilterId = filterId;
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  confirmDeleteFilter() {
    if (!this.deleteFilterId) return;

    this.filterService.deleteFilter(this.deleteFilterId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Xóa bộ lọc thành công!');
          this.isDeleteModalOpen = false;
          this.deleteFilterId = null;
          this.loadData();
        } else {
          this.notificationService.error('Lỗi: ' + response.message);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notificationService.error('Lỗi khi xóa bộ lọc:', error);
        this.isDeleteModalOpen = false;
        this.cdr.detectChanges();
      }
    });
  }
}

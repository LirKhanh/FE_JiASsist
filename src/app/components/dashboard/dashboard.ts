import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { FilterService, Filter } from '../../services/filter.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  projects: any[] = [];
  dynamicFilters: any[] = [];
  filterState: { [key: string]: { show: boolean, collapsed: boolean, values: { [key: string]: string } } } = {};

  // Filter Management States
  isManageModalOpen = false;
  isEditFilterMode = false;
  isSaving = false;
  myFilters: Filter[] = [];
  currentFilter: Partial<Filter> = {};

  // Delete Modal
  isDeleteModalOpen = false;
  deleteFilterId: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private filterService: FilterService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    const user = this.authService.getUser();
    if (!user) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.dashboardService.getDashboardSummary(user.userId).subscribe({
      next: (res: any) => {
        const isSuccess = res.success !== undefined ? res.success : res.Success;
        const data = res.data || res.Data || res;

        if (isSuccess !== false && data) {
          this.projects = data.projects || data.Projects || [];
          this.dynamicFilters = data.dynamicFilters || data.DynamicFilters || [];
          
          // Initialize filter state for each dynamic filter
          this.dynamicFilters.forEach(f => {
            if (!this.filterState[f.filterId]) {
              this.filterState[f.filterId] = {
                show: false,
                collapsed: false,
                values: {
                  type: '',
                  key: '',
                  summary: '',
                  priority: '',
                  status: ''
                }
              };
            }
          });
        } else if (res.projects || res.dynamicFilters) {
          this.projects = res.projects || [];
          this.dynamicFilters = res.dynamicFilters || [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải dashboard:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter Management Methods
  openManageModal() {
    const user = this.authService.getUser();
    if (!user) return;

    this.isLoading = true;
    this.filterService.getUserFilters(user.userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.myFilters = res.data;
        }
        this.isManageModalOpen = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error('Không thể tải danh sách bộ lọc');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeManageModal() {
    this.isManageModalOpen = false;
    this.isEditFilterMode = false;
    this.currentFilter = {};
  }

  openAddFilter() {
    this.isEditFilterMode = false;
    this.currentFilter = {
      filterId: '',
      strSql: '',
      actionType: 'A'
    };
    // Type is hidden and handled automatically during save
  }

  editFilter(filter: Filter) {
    this.isEditFilterMode = true;
    this.currentFilter = {
      ...filter,
      actionType: 'E'
    };
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
      this.notificationService.info('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const user = this.authService.getUser();
    if (!user) return;

    this.isSaving = true;
    const dataToSave = { ...this.currentFilter };

    // Always treat as custom on Dashboard
    if (dataToSave.actionType === 'A') {
      dataToSave.type = `${user.userId}-${this.generateRandomString(20)}`;
    }

    this.filterService.saveFilter(dataToSave).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.success(res.message || 'Lưu bộ lọc thành công');
          this.isEditFilterMode = false;
          this.currentFilter = {};
          this.openManageModal(); // Refresh list in modal
          this.loadDashboardData(); // Refresh dashboard gadgets
        } else {
          this.notificationService.error(res.message || 'Lỗi khi lưu bộ lọc');
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error('Lỗi hệ thống khi lưu bộ lọc');
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
      next: (res) => {
        if (res.success) {
          this.notificationService.success('Xóa bộ lọc thành công');
          this.isDeleteModalOpen = false;
          this.deleteFilterId = null;
          this.openManageModal(); // Refresh list
          this.loadDashboardData(); // Refresh dashboard
        } else {
          this.notificationService.error(res.message || 'Lỗi khi xóa bộ lọc');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error('Lỗi khi xóa bộ lọc');
        this.isDeleteModalOpen = false;
        this.cdr.detectChanges();
      }
    });
  }

  getAvatar(name: string): string {
    if (!name) return 'https://ui-avatars.com/api/?name=U&background=0052CC&color=fff';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0052CC&color=fff`;
  }

  // Navigation Methods
  goToProject(projectId: string) {
    // Navigate to project's issue list (all)
    this.router.navigate(['/projects', projectId, 'issues', 'all']);
  }

  goToIssue(projectId: string, issueId: string) {
    if (!projectId || !issueId) return;
    this.router.navigate(['/projects', projectId, 'issues', issueId]);
  }

  // Local Filtering Logic
  toggleFilters(filterId: string) {
    if (this.filterState[filterId]) {
      this.filterState[filterId].show = !this.filterState[filterId].show;
      // If expanding filters, make sure gadget is not collapsed
      if (this.filterState[filterId].show) {
        this.filterState[filterId].collapsed = false;
      }
    }
  }

  toggleCollapse(filterId: string) {
    if (this.filterState[filterId]) {
      this.filterState[filterId].collapsed = !this.filterState[filterId].collapsed;
    }
  }

  clearFilters(filterId: string) {
    if (this.filterState[filterId]) {
      this.filterState[filterId].values = {
        type: '',
        key: '',
        summary: '',
        priority: '',
        status: ''
      };
    }
  }

  getFilteredIssues(filter: any) {
    const state = this.filterState[filter.filterId];
    if (!state || !state.values) return filter.issues || [];

    const values = state.values;
    return (filter.issues || []).filter((issue: any) => {
      const typeMatch = !values['type'] || (issue.issue_type || '').toLowerCase().includes(values['type'].toLowerCase());
      const keyMatch = !values['key'] || (issue.issue_id || issue.key || '').toLowerCase().includes(values['key'].toLowerCase());
      const summaryMatch = !values['summary'] || (issue.issue_name || issue.summary || '').toLowerCase().includes(values['summary'].toLowerCase());
      const priorityMatch = !values['priority'] || (issue.issue_priority_id || '').toLowerCase().includes(values['priority'].toLowerCase());
      const statusMatch = !values['status'] || (issue.issue_status || issue.status || '').toLowerCase().includes(values['status'].toLowerCase());

      return typeMatch && keyMatch && summaryMatch && priorityMatch && statusMatch;
    });
  }

  hasActiveFilters(filterId: string): boolean {
    const state = this.filterState[filterId];
    if (!state) return false;
    return Object.values(state.values).some(v => !!v);
  }
}

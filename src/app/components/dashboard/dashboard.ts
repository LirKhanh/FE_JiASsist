import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  projects: any[] = [];
  dynamicFilters: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

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

  getAvatar(name: string): string {
    if (!name) return 'https://ui-avatars.com/api/?name=U&background=0052CC&color=fff';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0052CC&color=fff`;
  }
}

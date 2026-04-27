import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService } from '../../../services/projects.service';
import { NotificationService } from '../../../services/notification.service';
import { AiService } from '../../../services/ai.service';
import { BaseService, ComboboxRequest } from '../../../services/base.service';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Pipe({
  name: 'filterStatus',
  standalone: true
})
export class FilterStatusPipe implements PipeTransform {
  transform(issues: any[], status: string): any[] {
    if (!issues) return [];
    return issues.filter(i => (i.issueStatus || i.issue_status || i.status || '').toUpperCase() === status.toUpperCase());
  }
}

@Component({
  selector: 'app-project-statistics',
  standalone: true,
  imports: [CommonModule, FilterStatusPipe, FormsModule],
  templateUrl: './project-statistics.html',
  styleUrl: './project-statistics.css'
})
export class ProjectStatisticsComponent implements OnInit, AfterViewInit {
  @ViewChild('burndownChart') burndownChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('progressChart') progressChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workloadChart') workloadChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('riskChart') riskChartCanvas!: ElementRef<HTMLCanvasElement>;

  projectId: string = '';
  project: any = null;
  issues: any[] = [];
  filteredIssues: any[] = [];
  completionRate: number = 0;
  isLoading = true;

  // Calendar data
  calendarDays: any[] = [];
  currentMonth: Date = new Date();

  // AI Evaluation
  sprints: any[] = [];
  epics: string[] = [];
  selectedSprintId: string = '';
  selectedEpicId: string = '';
  aiEvaluation: string = '';
  isEvaluating = false;
  usersMap: { [key: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
    private aiService: AiService,
    private baseService: BaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    if (this.projectId) {
      this.loadProjectData();
      this.loadSprintsAndEpics();
    } else {
      this.notificationService.error('Project ID not found');
      this.router.navigate(['/projects']);
    }
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadProjectData(): void {
    this.isLoading = true;
    this.projectsService.getProjectDetail(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.project = res.data;
          this.loadIssuesData();
        } else {
          this.notificationService.error(res.message);
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.notificationService.error('Failed to load project details');
        this.isLoading = false;
      }
    });
  }

  loadIssuesData(): void {
    this.projectsService.getIssuesByProjectId(this.projectId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.issues = res.data.issues || [];
          this.filteredIssues = [...this.issues];
          this.isLoading = false;
          this.calculateStatistics();
          this.generateCalendar();
          this.cdr.detectChanges();
          setTimeout(() => this.initCharts(), 100);
        } else {
          this.notificationService.error('Failed to load project issues');
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.notificationService.error('An error occurred while loading issues');
        this.isLoading = false;
      }
    });
  }

  getStepColor(status: string): string {
    const s = (status || '').toUpperCase().replace(/\s/g, '');
    if (s.includes('REOPEN')) return '#EF4444'; // red-500
    if (s.includes('OPEN')) return '#3B82F6';   // blue-500
    if (s.includes('STOP')) return '#F97316';   // orange-500
    if (s.includes('INPROGRESS')) return '#EAB308'; // yellow-500
    if (s.includes('INREVIEW') || s.includes('INTESTING')) return '#A855F7'; // purple-500
    if (s.includes('BAREVIEW') || s.includes('BATESTING')) return '#06B6D4'; // cyan-500
    if (s.includes('DONE')) return '#10B981';   // green-500
    return '#9CA3AF'; // gray-400
  }

  initCharts(): void {
    if (!this.burndownChartCanvas) return;
    this.createBurndownChart();
    this.createProgressChart();
    this.createWorkloadChart();
    this.createRiskChart();
  }

  createBurndownChart(): void {
    const labels = ['Bắt đầu', 'Tuần 1', 'Tuần 2', 'Tuần 3', 'Hiện tại'];
    const idealData = [100, 75, 50, 25, 0];
    const actualData = [100, 90, 70, 45, 30]; // Dữ liệu giả lập

    new Chart(this.burndownChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Lý tưởng', data: idealData, borderColor: '#CBD5E1', borderDash: [5, 5], fill: false },
          { label: 'Thực tế', data: actualData, borderColor: '#4F46E5', backgroundColor: '#4F46E5', fill: true, tension: 0.4 }
        ]
      },
      options: { responsive: true, plugins: { title: { display: true, text: 'Biểu đồ Burndown' } } }
    });
  }

  createProgressChart(): void {
    const done = this.filteredIssues.filter(i => (i.issueStatus || '').toUpperCase() === 'DONE').length;
    const remaining = this.filteredIssues.length - done;

    new Chart(this.progressChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Hoàn thành', 'Còn lại'],
        datasets: [{
          data: [done, remaining],
          backgroundColor: ['#10B981', '#F1F5F9']
        }]
      },
      options: { 
        responsive: true, 
        cutout: '80%',
        plugins: { title: { display: true, text: 'Tổng tiến độ (%)' } } 
      }
    });
  }

  createWorkloadChart(): void {
    const userWorkload: { [key: string]: number } = {};
    this.filteredIssues.forEach(i => {
      const userId = i.assigneeId || 'Unassigned';
      const userName = this.usersMap[userId] || userId;
      userWorkload[userName] = (userWorkload[userName] || 0) + (i.estimateDev || 0);
    });

    new Chart(this.workloadChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(userWorkload),
        datasets: [{
          label: 'Giờ ước tính',
          data: Object.values(userWorkload),
          backgroundColor: '#6366F1'
        }]
      },
      options: { indexAxis: 'y', responsive: true, plugins: { title: { display: true, text: 'Khối lượng công việc / User' } } }
    });
  }

  createRiskChart(): void {
    // Giả lập logic phân loại risk dựa trên status và deadline
    const risks = { 'Thấp': 0, 'Trung bình': 0, 'Cao': 0, 'Nguy cấp': 0 };
    this.filteredIssues.forEach(i => {
      const status = (i.issueStatus || '').toUpperCase();
      if (status === 'REOPEN') risks['Nguy cấp']++;
      else if (status === 'DONE') risks['Thấp']++;
      else risks['Trung bình']++;
    });

    new Chart(this.riskChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(risks),
        datasets: [{
          label: 'Số lượng Task',
          data: Object.values(risks),
          backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#EF4444']
        }]
      },
      options: { responsive: true, plugins: { title: { display: true, text: 'Phân bổ rủi ro' } } }
    });
  }

  loadSprintsAndEpics(): void {
    const request: ComboboxRequest = {
      queries: [
        `SELECT sprint_id as "sprintId", sprint_name as "sprintName" FROM sprints WHERE project_id = '${this.projectId}'`,
        `SELECT DISTINCT epic_id as "epicId" FROM issues WHERE project_id = '${this.projectId}' AND epic_id IS NOT NULL`,
        `SELECT user_id as "userId", username FROM users`
      ],
      keys: ['sprints', 'epics', 'users']
    };

    this.baseService.loadComboboxData(request).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.sprints = res.data.sprints || [];
          // Extract epic strings from the list of objects returned
          this.epics = (res.data.epics || []).map((e: any) => e.epicId);
          
          const users = res.data.users || [];
          users.forEach((u: any) => {
            this.usersMap[u.userId] = u.username;
          });
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.notificationService.error('Failed to load dropdown data');
      }
    });
  }

  onEvaluateSprint(): void {
    if (!this.selectedSprintId) return;
    this.isEvaluating = true;
    this.aiEvaluation = 'Evaluating progress with Gemini AI...';
    this.aiService.evaluateSprint(this.projectId, this.selectedSprintId).subscribe({
      next: (res) => {
        this.aiEvaluation = res.data || 'No evaluation received.';
        this.isEvaluating = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.error('AI evaluation failed');
        this.isEvaluating = false;
        this.aiEvaluation = 'Error: Failed to get AI evaluation.';
      }
    });
  }

  onEvaluateEpic(): void {
    if (!this.selectedEpicId) return;
    this.isEvaluating = true;
    this.aiEvaluation = 'Evaluating progress with Gemini AI...';
    this.aiService.evaluateEpic(this.projectId, this.selectedEpicId).subscribe({
      next: (res) => {
        this.aiEvaluation = res.data || 'No evaluation received.';
        this.isEvaluating = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.error('AI evaluation failed');
        this.isEvaluating = false;
        this.aiEvaluation = 'Error: Failed to get AI evaluation.';
      }
    });
  }

  calculateStatistics(): void {
    if (this.filteredIssues.length === 0) {
      this.completionRate = 0;
      return;
    }
    const doneCount = this.filteredIssues.filter(i => (i.issueStatus || i.issue_status || '').toUpperCase() === 'DONE').length;
    const rawRate = (doneCount / this.filteredIssues.length) * 100;
    // Làm tròn xuống 3 chữ số thập phân
    this.completionRate = Math.floor(rawRate * 1000) / 1000;
  }

  onFilterChange(): void {
    // Luôn lấy toàn bộ dữ liệu dự án cho Biểu đồ và Lịch
    let query = `select * from issues where status is true and project_id = '${this.projectId}' order by update_at desc`;

    this.baseService.loadComboboxData({
      queries: [query],
      keys: ["issues"]
    }).subscribe(res => {
      if (res.success && res.data) {
        this.filteredIssues = res.data.issues || [];
        this.calculateStatistics();
        this.generateCalendar();
        this.cdr.detectChanges();
        setTimeout(() => this.initCharts(), 100);
      }
    });
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    this.calendarDays = [];
    for (let i = 0; i < firstDay; i++) this.calendarDays.push(null);
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dayIssues = this.filteredIssues.filter(i => {
        const deadline = i.deadlineDev || i.deadline_dev;
        return deadline && deadline.startsWith(dateStr);
      });
      
      this.calendarDays.push({
        day: d,
        tasks: dayIssues.map(i => ({
          id: i.issueId,
          status: i.issueStatus,
          color: this.getStepColor(i.issueStatus)
        }))
      });
    }
  }

  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

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
  @ViewChild('chatContainer') chatContainer!: ElementRef;

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
  chatMessages: { role: 'user' | 'ai', content: string, isError?: boolean }[] = [];
  chatInput: string = '';
  isEvaluating = false;
  usersMap: { [key: string]: string } = {};

  // Chart instances
  burndownChart: any;
  progressChart: any;
  workloadChart: any;
  riskChart: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
    private aiService: AiService,
    private baseService: BaseService,
    private cdr: ChangeDetectorRef
  ) { }

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
          const rawIssues = res.data.issues || res.data.Issues || [];
          this.issues = rawIssues.map((i: any) => this.mapToCamelCase(i));
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

    // Hủy các biểu đồ cũ nếu đã tồn tại
    if (this.burndownChart) this.burndownChart.destroy();
    if (this.progressChart) this.progressChart.destroy();
    if (this.workloadChart) this.workloadChart.destroy();
    if (this.riskChart) this.riskChart.destroy();

    this.createBurndownChart();
    this.createProgressChart();
    this.createWorkloadChart();
    this.createRiskChart();
  }

  private formatDateShort(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }

  createBurndownChart(): void {
    if (this.filteredIssues.length === 0) return;

    // 1. Thiết lập khoảng thời gian 6 tuần (4 tuần trước -> hiện tại -> 1 tuần sau)
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - (4 * 7)); // Lùi 4 tuần
    startDate.setHours(0, 0, 0, 0);

    const numSteps = 5; // 0, 1, 2, 3, 4 (Nay), 5 (Sau 1 tuần) -> Tổng 6 mốc
    const labels: string[] = [];
    const idealData: number[] = [];
    const actualData: number[] = [];

    const totalEstimate = this.filteredIssues.reduce((sum, i) => sum + (i.estimateDev || 0), 0);

    for (let i = 0; i <= numSteps; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (i * 7));

      let label = this.formatDateShort(currentDate);
      if (i === 4) label += " (Nay)";
      labels.push(label);

      // Ideal: Giảm dần đều từ tổng estimate về 0
      idealData.push(Math.max(0, totalEstimate - (totalEstimate * (i / numSteps))));

      // Actual: Tổng estimate - tổng estimate của các task đã DONE trước currentDate
      const completedEstimate = this.filteredIssues
        .filter(issue => {
          const status = (issue.issueStatus || issue.issue_status || '').toUpperCase();
          const updateDate = new Date(issue.updateAt || issue.update_at);
          return status === 'DONE' && updateDate <= currentDate;
        })
        .reduce((sum, issue) => sum + (issue.estimateDev || 0), 0);

      // Chỉ vẽ Actual cho đến mốc "Nay" (i=4)
      if (i <= 4) {
        actualData.push(totalEstimate - completedEstimate);
      }
    }

    this.burndownChart = new Chart(this.burndownChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Lý tưởng (h)',
            data: idealData,
            borderColor: '#CBD5E1',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Thực tế (h)',
            data: actualData,
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Biểu đồ Burndown theo tuần' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Giờ công (h)' } },
          x: { title: { display: true, text: 'Mốc thời gian (Tuần)' } }
        }
      }
    });
  }

  createProgressChart(): void {
    const done = this.filteredIssues.filter(i => (i.issueStatus || '').toUpperCase() === 'DONE').length;
    const remaining = this.filteredIssues.length - done;

    this.progressChart = new Chart(this.progressChartCanvas.nativeElement, {
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

    this.workloadChart = new Chart(this.workloadChartCanvas.nativeElement, {
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

    this.riskChart = new Chart(this.riskChartCanvas.nativeElement, {
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

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  onEvaluateSprint(): void {
    if (!this.selectedSprintId) return;
    const sprint = this.sprints.find(s => s.sprintId === this.selectedSprintId);
    const sprintName = sprint ? sprint.sprintName : this.selectedSprintId;
    this.chatInput = `Hãy phân tích tiến độ của Sprint: ${sprintName}`;
    this.onSendMessage();
  }

  onEvaluateEpic(): void {
    if (!this.selectedEpicId) return;
    this.chatInput = `Hãy phân tích tiến độ của Epic: ${this.selectedEpicId}`;
    this.onSendMessage();
  }

  onSendMessage(): void {
    if (!this.chatInput.trim() || this.isEvaluating) return;
    
    const userMessage = this.chatInput.trim();
    this.chatMessages.push({ role: 'user', content: userMessage });
    this.chatInput = '';
    this.isEvaluating = true;
    this.scrollToBottom();

    const payload = {
      sprintId: this.selectedSprintId || undefined,
      epicId: this.selectedEpicId || undefined,
      message: userMessage
    };

    this.aiService.chatWithAi(this.projectId, payload).subscribe({
      next: (res) => {
        this.chatMessages.push({ role: 'ai', content: res.data || 'Không nhận được dữ liệu đánh giá.' });
        this.isEvaluating = false;
        this.scrollToBottom();
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.error('AI evaluation failed');
        this.chatMessages.push({ role: 'ai', content: 'Lỗi: Không thể kết nối đến AI.', isError: true });
        this.isEvaluating = false;
        this.scrollToBottom();
        this.cdr.detectChanges();
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

  mapToCamelCase(i: any): any {
    if (!i) return i;
    return {
      issueId: i.issue_id || i.issueId,
      projectId: i.project_id || i.projectId,
      issueName: i.issue_name || i.issueName,
      issueStatus: i.issue_status || i.issueStatus,
      issueType: i.issue_type || i.issueType,
      sprintId: i.sprint_id || i.sprintId,
      epicId: i.epic_id || i.epicId,
      estimateDev: i.estimate_dev || i.estimateDev,
      estimateTest: i.estimate_test || i.estimateTest,
      assigneeId: i.assignee_id || i.assigneeId,
      deadlineDev: i.deadline_dev || i.deadlineDev,
      updateAt: i.update_at || i.updateAt,
      ...i
    };
  }

  onFilterChange(): void {
    let query = `select * from issues where status = true and project_id = '${this.projectId}'`;
    
    if (this.selectedSprintId) {
      query += ` and sprint_id = '${this.selectedSprintId}'`;
    }
    if (this.selectedEpicId) {
      query += ` and epic_id = '${this.selectedEpicId}'`;
    }
    
    query += ` order by update_at desc`;

    this.baseService.loadComboboxData({
      queries: [query],
      keys: ["issues"]
    }).subscribe(res => {
      if (res.success && res.data) {
        const rawIssues = res.data.issues || res.data.Issues || [];
        this.filteredIssues = rawIssues.map((i: any) => this.mapToCamelCase(i));
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

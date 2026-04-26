import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService } from '../../../services/projects.service';
import { NotificationService } from '../../../services/notification.service';
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
  imports: [CommonModule, FilterStatusPipe],
  templateUrl: './project-statistics.html',
  styleUrl: './project-statistics.css'
})
export class ProjectStatisticsComponent implements OnInit, AfterViewInit {
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart') typeChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('timeChart') timeChartCanvas!: ElementRef<HTMLCanvasElement>;

  projectId: string = '';
  project: any = null;
  issues: any[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    if (this.projectId) {
      this.loadProjectData();
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
          this.isLoading = false;
          this.cdr.detectChanges();
          this.initCharts();
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

  initCharts(): void {
    setTimeout(() => {
      this.createStatusChart();
      this.createPriorityChart();
      this.createTypeChart();
      this.createTimeChart();
    }, 0);
  }

  createStatusChart(): void {
    const statusCounts: { [key: string]: number } = {};
    this.issues.forEach(issue => {
      const status = issue.issueStatus || issue.issue_status || issue.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    new Chart(this.statusChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#4F46E5', // Indigo
            '#10B981', // Emerald
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#6B7280'  // Gray
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Issue Status Distribution' }
        }
      }
    });
  }

  createPriorityChart(): void {
    const priorityCounts: { [key: string]: number } = {};
    this.issues.forEach(issue => {
      const priority = issue.issuePriorityId || issue.issue_priority_id || issue.priority || 'Unknown';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    const labels = Object.keys(priorityCounts);
    const data = Object.values(priorityCounts);

    new Chart(this.priorityChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Issues',
          data: data,
          backgroundColor: '#4F46E5'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Issues by Priority' }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  createTypeChart(): void {
    const typeCounts: { [key: string]: number } = {};
    this.issues.forEach(issue => {
      const type = issue.issueType || issue.issue_type || issue.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);

    new Chart(this.typeChartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#EC4899', // Pink
            '#8B5CF6', // Violet
            '#06B6D4', // Cyan
            '#F97316'  // Orange
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Issue Type Distribution' }
        }
      }
    });
  }

  createTimeChart(): void {
    let totalDevEstimate = 0;
    let totalTestEstimate = 0;

    this.issues.forEach(issue => {
      totalDevEstimate += Number(issue.estimateDev || 0);
      totalTestEstimate += Number(issue.estimateTest || 0);
    });

    new Chart(this.timeChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Dev Estimate', 'Test Estimate'],
        datasets: [{
          label: 'Total Hours',
          data: [totalDevEstimate, totalTestEstimate],
          backgroundColor: ['#4F46E5', '#10B981']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Total Estimated Hours (Dev vs Test)' }
        },
        scales: {
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'Hours' }
          }
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueService } from '../../services/issue.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../../services/projects.service';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issues.html',
  styleUrl: './issues.css'
})
export class IssuesComponent implements OnInit {
  issues: any[] = [];
  selectedIssue: any | null = null;
  comments: any[] = [];
  attachments: any[] = [];
  histories: any[] = [];
  activeTab: 'comments' | 'history' = 'comments';
  loading = true;
  project: any = null;
  searchTerm: string = '';

  constructor(
    private issueService: IssueService,
    private projectsService: ProjectsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.project = navigation.extras.state['project'];
      this.issues = navigation.extras.state['issues'] || [];
      const latestIssue = navigation.extras.state['latestIssue'];
      if (latestIssue) {
        this.selectIssue(latestIssue);
      }
    }
  }

  get filteredIssues() {
    if (!this.searchTerm) return this.issues;
    const term = this.searchTerm.toLowerCase();
    return this.issues.filter(issue => 
      (issue.issueName || issue.issue_name || issue.summary || '').toLowerCase().includes(term) ||
      (issue.issueId || issue.issue_id || issue.key || '').toLowerCase().includes(term)
    );
  }

  ngOnInit() {
    if (this.issues.length === 0) {
      this.loadDataFromParams();
    } else {
      this.loading = false;
      if (!this.selectedIssue && this.issues.length > 0) {
        this.selectIssue(this.issues[0]);
      }
      this.cdr.detectChanges();
    }
  }

  loadDataFromParams() {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const issueIdFromRoute = this.route.snapshot.paramMap.get('issueId');

    if (!projectId) {
      this.loadDefaultIssues();
      return;
    }

    this.loading = true;
    this.projectsService.getProjectDetail(projectId).pipe(
      switchMap(projectRes => {
        if (projectRes.success) {
          this.project = projectRes.data;
          return this.projectsService.getIssuesByProjectId(projectId);
        }
        throw new Error('Project not found');
      }),
      switchMap((issuesRes: any) => {
        if (issuesRes.success && issuesRes.data) {
          this.issues = issuesRes.data.issues || [];
          
          // Determine which issue to load details for
          const targetId = (issueIdFromRoute && issueIdFromRoute !== 'all') 
            ? issueIdFromRoute 
            : issuesRes.data.latestIssueId;

          if (targetId && targetId !== 'undefined' && targetId !== 'null') {
            return this.projectsService.getIssueDetail(targetId);
          }
          
          // If no specific issue ID, but we have issues, load the first one
          if (this.issues.length > 0) {
            const firstId = this.issues[0].issueId || this.issues[0].issue_id || this.issues[0].id;
            if (firstId) return this.projectsService.getIssueDetail(firstId);
          }
        }
        return of({ success: false, data: null });
      })
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.updateSelectedIssueData(res.data);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading issue data:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateSelectedIssueData(data: any) {
    this.selectedIssue = data.issue;
    this.comments = data.comments || [];
    this.attachments = data.attachments || [];
    this.histories = data.histories || [];
  }

  loadDefaultIssues() {
    this.issueService.getIssues().subscribe(response => {
      if (response.success && response.data) {
        this.issues = response.data;
        if (this.issues.length > 0) {
          this.selectIssue(this.issues[0]);
        }
      }
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  selectIssue(issue: any) {
    if (!issue) return;
    const issueId = issue.issueId || issue.issue_id || issue.id;
    
    // Check if we already have this issue's full detail to avoid re-fetching 
    // (Only fetch if comments/history are missing or ID changed)
    if (this.selectedIssue && (this.selectedIssue.issueId === issueId) && this.comments.length > 0) {
      return;
    }

    if (!issueId) return;

    this.projectsService.getIssueDetail(issueId).subscribe(res => {
      if (res.success && res.data) {
        this.updateSelectedIssueData(res.data);
      } else {
        this.selectedIssue = issue;
        this.comments = [];
        this.attachments = [];
        this.histories = [];
      }
      this.cdr.detectChanges();
    });
  }

  getHistoryDetails(item: any) {
    try {
      const oldObj = JSON.parse(item.oldValue || '{}');
      const newObj = JSON.parse(item.newValue || '{}');
      const fields = Object.keys(newObj);
      
      return fields.map(field => ({
        field: field.replace(/([A-Z])/g, ' $1').trim(), // camelCase to Space Case
        oldValue: oldObj[field] ?? 'None',
        newValue: newObj[field] ?? 'None'
      }));
    } catch (e) {
      return [];
    }
  }

  getStatusConfig(status: string) {
    const steps = JSON.parse(localStorage.getItem('workflowSteps') || '[]');
    const step = steps.find((s: any) => s.stepId === status || s.stepName === status);
    
    const s = (status || '').toUpperCase();
    
    // Jira Standard Mapping
    if (s === 'OPEN' || s === 'REOPEN' || s === 'TO DO') {
      return { 
        class: 'bg-gray-100 text-gray-700 border-gray-200', 
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // Clock icon
        color: '#42526E' 
      };
    }
    if (s.includes('PROGRESS') || s.includes('TESTING') || s.includes('REVIEW')) {
      return { 
        class: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: 'M13 10V3L4 14h7v7l9-11h-7z', // Bolt icon
        color: '#0052CC' 
      };
    }
    if (s === 'DONE' || s === 'RESOLVED' || s === 'CLOSED') {
      return { 
        class: 'bg-green-100 text-green-700 border-green-200', 
        icon: 'M5 13l4 4L19 7', // Check icon
        color: '#00875A' 
      };
    }
    if (s === 'STOP') {
      return { 
        class: 'bg-red-100 text-red-700 border-red-200', 
        icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', // Blocked icon
        color: '#DE350B' 
      };
    }

    return { 
      class: 'bg-gray-100 text-gray-700 border-gray-200', 
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: '#42526E'
    };
  }

  getStatusClass(status: string): string {
    return this.getStatusConfig(status).class;
  }

  getPriorityIcon(priority: string): string {
    if (!priority) return 'text-gray-500';
    const p = priority.toLowerCase();
    if (p.includes('high') || p.includes('p1')) return 'text-red-500';
    if (p.includes('medium') || p.includes('p2')) return 'text-orange-500';
    if (p.includes('low') || p.includes('p3')) return 'text-blue-500';
    return 'text-gray-500';
  }
}

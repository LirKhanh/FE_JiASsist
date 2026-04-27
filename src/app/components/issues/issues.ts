import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueService } from '../../services/issue.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../../services/projects.service';
import { BaseService } from '../../services/base.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { RichTextEditorComponent } from '../shared/rich-text-editor/rich-text-editor';
import { IssueHubService } from '../../services/issue-hub.service';
import { switchMap, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, RichTextEditorComponent],
  templateUrl: './issues.html',
  styleUrl: './issues.css'
})
export class IssuesComponent implements OnInit, OnDestroy {
  @ViewChild('commentEditor') commentEditor!: RichTextEditorComponent;
  
  issues: any[] = [];
  selectedIssue: any | null = null;
  comments: any[] = [];
  attachments: any[] = [];
  histories: any[] = [];
  activeTab: 'comments' | 'history' = 'comments';
  loading = true;
  project: any = null;
  searchTerm: string = '';
  isCreateModalOpen = false;
  isEditMode = false;
  issueTypes: any[] = [];
  issuePriorities: any[] = [];
  users: any[] = [];
  sprints: any[] = [];
  epics: any[] = [];
  allProjectIssues: any[] = [];
  newIssue: any = {};

  // Editor states
  isEditingDescription = false;
  editingCommentId: number | null = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private issueService: IssueService,
    private projectsService: ProjectsService,
    private baseService: BaseService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private hubService: IssueHubService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
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

  ngOnInit() {
    this.hubService.startConnection();
    this.setupHubListeners();

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

  ngOnDestroy() {
    this.hubService.stopConnection();
    this.subscriptions.unsubscribe();
  }
scrollToComment() {
  const el = document.getElementById('commentSection');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' }); // mượt
  }
}
  setupHubListeners() {
    this.subscriptions.add(
      this.hubService.issueUpdated$.subscribe(data => {
        this.zone.run(() => {
          if (this.selectedIssue && (this.selectedIssue.issueId === data.issueId || this.selectedIssue.issueId === data.issue_id)) {
            if (data.description !== undefined) {
              this.selectedIssue.description = data.description;
            }
            if (data.attachments) {
              this.attachments = data.attachments;
            }
            if (data.issueName) {
              Object.assign(this.selectedIssue, data);
            }
            this.cdr.detectChanges();
          }
          
          const idx = this.issues.findIndex(i => (i.issueId || i.issue_id) === (data.issueId || data.issue_id));
          if (idx !== -1) {
            Object.assign(this.issues[idx], data);
            this.cdr.detectChanges();
          }
        });
      })
    );

    this.subscriptions.add(
      this.hubService.commentAdded$.subscribe(data => {
        this.zone.run(() => {
          if (this.selectedIssue && this.selectedIssue.issueId === data.issueId) {
            this.projectsService.getIssueDetail(data.issueId).subscribe(res => {
              if (res.success && res.data) {
                this.comments = res.data.comments || [];
                this.cdr.detectChanges();
              }
            });
          }
        });
      })
    );

    this.subscriptions.add(
      this.hubService.commentUpdated$.subscribe(data => {
        this.zone.run(() => {
          const comment = this.comments.find(c => c.issueCommentId === data.commentId);
          if (comment) {
            comment.content = data.content;
            this.cdr.detectChanges();
          }
        });
      })
    );
  }

  get filteredIssues() {
    if (!this.searchTerm) return this.issues;
    const term = this.searchTerm.toLowerCase();
    return this.issues.filter(issue => 
      (issue.issueName || issue.issue_name || issue.summary || '').toLowerCase().includes(term) ||
      (issue.issueId || issue.issue_id || issue.key || '').toLowerCase().includes(term)
    );
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
        this.zone.run(() => {
          if (res.success && res.data) {
            this.updateSelectedIssueData(res.data);
          }
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Error loading issue data:', err);
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  updateSelectedIssueData(data: any) {
    this.selectedIssue = data.issue;
    if (this.selectedIssue && !this.selectedIssue.issueId && this.selectedIssue.issue_id) {
      this.selectedIssue.issueId = this.selectedIssue.issue_id;
    }
    this.comments = data.comments || [];
    this.attachments = data.attachments || [];
    this.histories = data.histories || [];
  }

  loadDefaultIssues() {
    this.issueService.getIssues().subscribe(response => {
      this.zone.run(() => {
        if (response.success && response.data) {
          this.issues = response.data;
          if (this.issues.length > 0) {
            this.selectIssue(this.issues[0]);
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  selectIssue(issue: any) {
    if (!issue) return;
    const issueId = issue.issueId || issue.issue_id || issue.id;
    const currentSelectedId = this.selectedIssue?.issueId || this.selectedIssue?.issue_id || this.selectedIssue?.id;
    
    if (this.selectedIssue && (currentSelectedId === issueId) && this.comments.length > 0) {
      return;
    }

    if (!issueId) return;

    // Reset editor states
    this.isEditingDescription = false;
    this.editingCommentId = null;
    
    // Clear comment editor content when switching issues
    if (this.commentEditor) {
      this.commentEditor.clear();
    }

    this.projectsService.getIssueDetail(issueId).subscribe(res => {
      this.zone.run(() => {
        if (res.success && res.data) {
          this.updateSelectedIssueData(res.data);
          if (this.project?.projectId) {
            this.hubService.joinProject(this.project.projectId);
          }
          this.hubService.joinIssue(issueId);
        } else {
          this.selectedIssue = issue;
          this.comments = [];
          this.attachments = [];
          this.histories = [];
        }
        this.cdr.detectChanges();
      });
    });
  }

  // Rich Text Editor Actions

  saveDescription(event: { html: string, files: File[] }) {
    if (!this.selectedIssue) return;

    const userId = this.authService.getUser()?.userId || '';
    const formData = new FormData();
    formData.append('description', event.html);
    formData.append('userId', userId);
    event.files.forEach(file => {
      formData.append('files', file);
    });

    this.issueService.updateDescription(this.selectedIssue.issueId, formData).subscribe(res => {
      this.zone.run(() => {
        if (res.success) {
          this.notificationService.success('Description updated');
          this.isEditingDescription = false;
          if (res.data.description) this.selectedIssue.description = res.data.description;
          if (res.data.attachments) this.attachments = res.data.attachments;
          this.cdr.detectChanges();
        } else {
          this.notificationService.error('Failed to update description');
        }
      });
    });
  }

  addComment(event: { html: string, files: File[] }) {
    if (!this.selectedIssue) return;

    const userId = this.authService.getUser()?.userId || '';
    const formData = new FormData();
    formData.append('content', event.html);
    formData.append('userId', userId);
    event.files.forEach(file => {
      formData.append('files', file);
    });

    this.issueService.addComment(this.selectedIssue.issueId, formData).subscribe(res => {
      this.zone.run(() => {
        if (res.success) {
          this.notificationService.success('Comment added');
          if (this.commentEditor) this.commentEditor.clear();
          // SignalR will update the list, but we can also re-fetch for safety
          this.projectsService.getIssueDetail(this.selectedIssue.issueId).subscribe(res => {
            this.zone.run(() => {
              if (res.success && res.data) {
                this.comments = res.data.comments || [];
                this.attachments = res.data.attachments || [];
                this.cdr.detectChanges();
              }
            });
          });
        } else {
          this.notificationService.error('Failed to add comment');
        }
      });
    });
  }

  startEditComment(comment: any) {
    this.editingCommentId = comment.issueCommentId;
    this.cdr.detectChanges();
  }

  saveEditedComment(commentId: number, event: { html: string, files: File[] }) {
    const userId = this.authService.getUser()?.userId || '';
    this.issueService.updateComment(commentId, event.html, userId).subscribe(res => {
      this.zone.run(() => {
        // Backend returns void or Ok, we just need to know it's success
        this.notificationService.success('Comment updated');
        this.editingCommentId = null;
        // Content will be updated via SignalR or we can update locally
        const comment = this.comments.find(c => c.issueCommentId === commentId);
        if (comment) comment.content = event.html;
        this.cdr.detectChanges();
      });
    }, err => {
      this.zone.run(() => {
        this.notificationService.error('Failed to update comment');
      });
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

  // Workflow Logic
  getCurrentStep(): any {
    if (!this.selectedIssue) return null;
    const steps = JSON.parse(localStorage.getItem('workflowSteps') || '[]');
    return steps.find((s: any) => s.stepId === this.selectedIssue.issueStatus) || { stepId: this.selectedIssue.issueStatus, stepName: this.selectedIssue.issueStatus };
  }

  getPreviousStep(): any {
    const current = this.getCurrentStep();
    if (!current || !current.preStepId) return null;
    const steps = JSON.parse(localStorage.getItem('workflowSteps') || '[]');
    return steps.find((s: any) => s.stepId === current.preStepId);
  }

  getNextStep(): any {
    const current = this.getCurrentStep();
    if (!current || !current.nextStepId) return null;
    const steps = JSON.parse(localStorage.getItem('workflowSteps') || '[]');
    return steps.find((s: any) => s.stepId === current.nextStepId);
  }

  getStepColor(id: string): string {
    if (!id) return 'bg-gray-400 text-white';
    const s = id.toUpperCase();
    if (s.includes('REOPEN')) return 'bg-red-500 text-white';
    if (s.includes('OPEN')) return 'bg-blue-500 text-white';
    if (s.includes('INPROGRESS')) return 'bg-yellow-500 text-white';
    if ((s.includes('INREVIEW') || s.includes('INTESTING'))&&!s.includes('BA')) return 'bg-purple-500 text-white';
    if (s.includes('BA') ) return 'bg-cyan-500 text-white';
    if (s.includes('DONE')) return 'bg-green-500 text-white';
    return 'bg-gray-400 text-white';
  }

  updateIssueStatus(newStatus: string) {
    if (!this.selectedIssue || this.selectedIssue.issueStatus === newStatus) return;

    const updatedIssue = { 
      ...this.selectedIssue, 
      issueStatus: newStatus,
      updateAt: new Date(),
      updateBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId
    };

    // Use the existing updateIssue API
    this.issueService.updateIssue(this.selectedIssue.issueId, updatedIssue).subscribe(res => {
      this.zone.run(() => {
        if (res.success) {
          this.notificationService.success(`Status updated to ${newStatus}`);
          this.selectedIssue.issueStatus = newStatus;
          this.loadDataFromParams(); // Refresh to sync data
          this.cdr.detectChanges();
        } else {
          this.notificationService.error('Failed to update status: ' + res.message);
        }
      });
    });
  }

  getStatusConfig(status: string) {
    const s = (status || '').toUpperCase();
    console.log(1);
    // REOPEN -> Red
    if (s === 'REOPEN') {
      return { 
        class: 'bg-red-100 text-red-700 border-red-200', 
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        color: '#DE350B' 
      };
    }
    // OPEN / TO DO -> Blue
    if (s === 'OPEN' || s === 'TO DO') {
      return { 
        class: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        color: '#0052CC' 
      };
    }
    // IN PROGRESS -> Yellow
    if (s.includes('PROGRESS')) {
      return { 
        class: 'bg-amber-100 text-amber-700 border-amber-200', 
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        color: '#FFAB00' 
      };
    }
    // IN REVIEW / IN TESTING -> Purple
    if ((s.includes('TESTING') || s.includes('REVIEW'))&&!s.includes('BA')) {
      return { 
        class: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        color: '#6554C0' 
      };
    }
     // BA REVIEW / BA TESTING -> Purple
    if (s.includes('BA')) {
      return { 
        class: 'bg-cyan-100 text-cyan-700 border-cyan-200', 
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        color: '#06b6d4' 
      };
    }
    // DONE / RESOLVED -> Green
    if (s === 'DONE' || s === 'RESOLVED' || s === 'CLOSED') {
      return { 
        class: 'bg-green-100 text-green-700 border-green-200', 
        icon: 'M5 13l4 4L19 7',
        color: '#00875A' 
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

  private loadModalData(projectId: string) {
    // Load from localStorage
    try {
      this.issueTypes = JSON.parse(localStorage.getItem('issueTypes') || '[]');
      this.issuePriorities = JSON.parse(localStorage.getItem('issuePriorities') || '[]');
    } catch (e) {
      this.issueTypes = [];
      this.issuePriorities = [];
    }

    // Load combobox data
    this.baseService.loadComboboxData({
      queries: [
        "select user_id, username, fullname from users where status is true",
        "select sprint_id, sprint_name from sprints where project_id = '" + projectId + "'",
        "select issue_id, issue_name from issues where issue_type = 'EPIC' and project_id = '" + projectId + "'",
        "select issue_id, issue_name from issues where project_id = '" + projectId + "'"
      ],
      keys: ["users", "sprints", "epics", "issues"]
    }).subscribe(res => {
      this.zone.run(() => {
        if (res.success && res.data) {
          this.users = res.data.users || [];
          this.sprints = res.data.sprints || [];
          this.epics = res.data.epics || [];
          this.allProjectIssues = res.data.issues || [];
          this.cdr.detectChanges();
        }
      });
    });
  }

  openCreateModal() {
    const projectId = this.project?.projectId || this.route.snapshot.paramMap.get('projectId') || (this.issues.length > 0 ? (this.issues[0].projectId || this.issues[0].project_id) : null);
    if (!projectId) {
      this.notificationService.warning('Please select a project first');
      return;
    }

    this.isEditMode = false;
    this.loadModalData(projectId);

    this.projectsService.getNewIssueId(projectId).subscribe(res => {
      this.zone.run(() => {
        if (res.success && res.data) {
          const nowFormatted = new Date().toISOString().slice(0, 16); // For datetime-local input

          this.newIssue = {
            issueId: res.data,
            projectId: projectId,
            issueName: '',
            issueStatus: 'OPEN',
            issueType: this.issueTypes.length > 0 ? (this.issueTypes[0].issueTypeId || this.issueTypes[0]) : 'TASK',
            issuePriorityId: this.issuePriorities.length > 0 ? (this.issuePriorities[0].issuePriorityId || this.issuePriorities[0]) : 'MEDIUM',
            description: '',
            issueAttachmentId: '',
            listIssues: '',
            sprintId: '',
            epicId: '',
            issueDevRate: 0,
            estimateDev: 0,
            estimateReopenDev: 0,
            issueTestRate: 0,
            estimateTest: 0,
            estimateReopenTest: 0,
            reporterId: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
            assigneeId: '',
            developerId: '',
            testerId: '',
            baId: '',
            cusRequestDate: nowFormatted,
            pmRequestDate: nowFormatted,
            deadlineDev: nowFormatted,
            deadlineTest: nowFormatted,
            status: true,
            createdAt: new Date(),
            createdBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
            updateAt: new Date(),
            updateBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId
          };
          this.isCreateModalOpen = true;
          this.cdr.detectChanges();
        } else {
          this.notificationService.error('Failed to get new Issue ID');
        }
      });
    });
  }

  openEditModal(issue: any) {
    if (!issue) return;
    const projectId = this.project?.projectId || issue.projectId || issue.project_id;
    if (!projectId) return;

    this.isEditMode = true;
    this.loadModalData(projectId);

    // Map existing issue to newIssue object
    this.newIssue = {
      ...issue,
      issueId: issue.issueId || issue.issue_id,
      projectId: projectId,
      cusRequestDate: this.formatDateForInput(issue.cusRequestDate),
      pmRequestDate: this.formatDateForInput(issue.pmRequestDate),
      deadlineDev: this.formatDateForInput(issue.deadlineDev),
      deadlineTest: this.formatDateForInput(issue.deadlineTest),
      updateAt: new Date(),
      updateBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId
    };

    this.isCreateModalOpen = true;
    this.cdr.detectChanges();
  }

 private formatDateForInput(date: any): string {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  isImage(fileName: string): boolean {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  }

  saveNewIssue() {
    if (!this.newIssue.issueName) {
      this.notificationService.warning('Issue Name is required');
      return;
    }

    // Ensure issueId and projectId are present
    if (this.isEditMode) {
      this.newIssue.issueId = this.newIssue.issueId || this.newIssue.issue_id;
    }
    
    if (!this.newIssue.projectId) {
      this.newIssue.projectId = this.project?.projectId || this.newIssue.project_id;

    }

    const request = this.isEditMode 
      ? this.issueService.updateIssue(this.newIssue.issueId, this.newIssue)
      : this.issueService.saveIssue(this.newIssue);
    console.log(1);
    request.subscribe(res => {
      this.zone.run(() => {
        if (res.success) {
          this.notificationService.success(this.isEditMode ? 'Issue updated successfully' : 'Issue created successfully');
          this.isCreateModalOpen = false;
          this.closeCreateModal()
          this.loadDataFromParams(); // Refresh the list
        } else {
          this.notificationService.error('Error saving issue: ' + res.message);
        }
      });
    });
  }
}

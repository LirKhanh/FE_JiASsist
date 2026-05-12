import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsService, ProjectResponse } from '../../services/projects.service';
import { switchMap, of, catchError } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class ProjectsComponent implements OnInit {
  projects: ProjectResponse[] = [];
  isLoading = true;
  errorMessage = '';
  currentUser: any = null;
  // Assign Users Modal
  showAssignModal = false;
  selectedProjectId = '';
  assignableUsers: any[] = [];
  selectedUserIds: string[] = [];
  isAssigning = false;
  userSearchTerm = '';

  constructor(
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const userId = user.userId;
      if (userId) {
        this.loadProjects(userId);
      } else {
        this.errorMessage = 'User ID not found in session.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    } else {
      this.errorMessage = 'User not logged in.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  loadProjects(userId: string): void {
    this.isLoading = true;

    this.projectsService.getProjectsByUserId(userId).subscribe({
      next: (response) => {

        if (response.success && response.data) {
          this.projects = response.data;
          this.currentUser = JSON.parse(window.localStorage.getItem('user') || '{}');
          console.log(this.currentUser);
          this.cdr.detectChanges();
        } else {
          this.errorMessage = response.message || 'Failed to load projects.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'An error occurred while fetching projects.';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  viewProjectDetails(projectId: string): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    let projectDetail: any;
    let issuesData: any;

    this.projectsService.getProjectDetail(projectId).pipe(
      switchMap(detailRes => {
        if (detailRes.success) {
          projectDetail = detailRes.data;
          return this.projectsService.getIssuesByProjectId(projectId);
        } else throw new Error(detailRes.message || 'Failed to load project details.');
      }),
      switchMap(issuesRes => {
        if (issuesRes.success) {
          issuesData = issuesRes.data;
          if (issuesData.latestIssueId) {
            return this.projectsService.getIssueDetail(issuesData.latestIssueId);
          }
          return of({ success: true, data: null });
        } else throw new Error(issuesRes.message || 'Failed to load project issues.');
      }),
      catchError(err => {
        throw err;
      })
    ).subscribe({
      next: (latestIssueRes: any) => {
        const latestIssueDetail = latestIssueRes?.success ? latestIssueRes.data : null;

        this.notificationService.success('Project data loaded. Redirecting...');

        // Navigate to the old URL structure with /all
        const issueId = 'all';
        this.router.navigate(['/projects', projectId, 'issues', issueId], {
          state: {
            project: projectDetail,
            issues: issuesData.issues,
            latestIssue: latestIssueDetail
          }
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error(err.message || 'An error occurred.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewProjectStatistics(projectId: string): void {
    this.router.navigate([`/projects/${projectId}/statistics`]);
  }

  openAssignModal(projectId: string): void {
    this.selectedProjectId = projectId;
    this.selectedUserIds = [];
    this.loadAssignableUsers(projectId);
  }

  loadAssignableUsers(projectId: string): void {
    this.isLoading = true;
    this.projectsService.getAssignableUsers(projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.assignableUsers = res.data || [];
          this.showAssignModal = true;
        } else {
          this.notificationService.error(res.message || 'Failed to load users.');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error('Error loading assignable users.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedProjectId = '';
    this.selectedUserIds = [];
    this.userSearchTerm = '';
  }

  get filteredUsers(): any[] {
    if (!this.userSearchTerm) {
      return this.assignableUsers;
    }
    const term = this.userSearchTerm.toLowerCase();
    return this.assignableUsers.filter(u =>
      (u.fullname?.toLowerCase().includes(term)) ||
      (u.username?.toLowerCase().includes(term))
    );
  }

  toggleUserSelection(userId: string): void {
    const index = this.selectedUserIds.indexOf(userId);
    if (index > -1) {
      this.selectedUserIds.splice(index, 1);
    } else {
      this.selectedUserIds.push(userId);
    }
  }

  assignUsers(): void {
    if (this.selectedUserIds.length === 0) {
      this.notificationService.error('Please select at least one user.');
      return;
    }

    this.isAssigning = true;
    this.projectsService.assignUsersToProject(this.selectedProjectId, this.selectedUserIds).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.success('Users assigned successfully.');
          this.closeAssignModal();
        } else {
          this.notificationService.error(res.message || 'Failed to assign users.');
        }
        this.isAssigning = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error('Error assigning users.');
        this.isAssigning = false;
        this.cdr.detectChanges();
      }
    });
  }
}

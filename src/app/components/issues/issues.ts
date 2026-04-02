import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueService, Issue } from '../../services/issue.service';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issues.html',
  styleUrl: './issues.css'
})
export class IssuesComponent implements OnInit {
  issues: Issue[] = [];
  selectedIssue: Issue | null = null;
  loading = true;

  constructor(private issueService: IssueService) {}

  ngOnInit() {
    this.issueService.getIssues().subscribe(response => {
      if (response.success && response.data) {
        this.issues = response.data;
        if (this.issues.length > 0) {
          this.selectedIssue = this.issues[0];
        }
      }
      this.loading = false;
    });
  }

  selectIssue(issue: Issue) {
    this.selectedIssue = issue;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'TO DO': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'IN PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DONE': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-orange-500';
      case 'Low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }
}

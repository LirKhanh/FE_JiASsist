import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  recentIssues = [
    { key: 'JA-101', summary: 'Fix login performance', status: 'IN PROGRESS', priority: 'High' },
    { key: 'JA-102', summary: 'Add navigation bar', status: 'TO DO', priority: 'Medium' },
    { key: 'JA-103', summary: 'Update dashboard colors', status: 'DONE', priority: 'Low' }
  ];

  assignedToMe = [
    { key: 'JA-104', summary: 'Create Jira Overview', status: 'IN PROGRESS', priority: 'High' },
    { key: 'JA-105', summary: 'Fix CSS bugs', status: 'TO DO', priority: 'Medium' }
  ];

  projects = [
    { name: 'JiAssist FE', type: 'Software', lead: 'Admin' },
    { name: 'JiAssist BE', type: 'Service', lead: 'Developer' }
  ];

  updates = [
    { user: 'Admin', action: 'Created issue', target: 'JA-106', time: '2h ago' },
    { user: 'Dev', action: 'Changed status', target: 'JA-101', time: '4h ago' }
  ];
}

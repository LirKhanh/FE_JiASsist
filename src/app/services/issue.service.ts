import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { ApiResponse } from './project.service';

export interface Issue {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: 'TO DO' | 'IN PROGRESS' | 'DONE';
  priority: 'High' | 'Medium' | 'Low';
  type: 'Bug' | 'Task' | 'Story';
  assignee: string;
  reporter: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private apiUrl = '/api/admin/Issue/';

  constructor(private http: HttpClient) { }

  getIssues(): Observable<ApiResponse<Issue[]>> {
    // For now, return mock data
    const mockIssues: Issue[] = [
      {
        id: '1',
        key: 'JA-101',
        summary: 'Fix login performance',
        description: 'The login page takes more than 5 seconds to load. We need to optimize the auth service.',
        status: 'IN PROGRESS',
        priority: 'High',
        type: 'Bug',
        assignee: 'Admin',
        reporter: 'Admin',
        projectId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        key: 'JA-102',
        summary: 'Add navigation bar',
        description: 'The navigation bar is missing from the main dashboard. It should include links to Projects and Issues.',
        status: 'TO DO',
        priority: 'Medium',
        type: 'Task',
        assignee: 'Unassigned',
        reporter: 'Admin',
        projectId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        key: 'JA-103',
        summary: 'Update dashboard colors',
        description: 'The dashboard colors are not aligned with the new branding guidelines. We need to update the Tailwind theme.',
        status: 'DONE',
        priority: 'Low',
        type: 'Story',
        assignee: 'Developer',
        reporter: 'Admin',
        projectId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        key: 'JA-104',
        summary: 'Implement issue detail view',
        description: 'Users should be able to see the full details of an issue by clicking on it in the list.',
        status: 'IN PROGRESS',
        priority: 'High',
        type: 'Task',
        assignee: 'Admin',
        reporter: 'Admin',
        projectId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return of({
      success: true,
      message: 'Issues fetched successfully',
      data: mockIssues,
      error: ''
    });
  }

  getIssueByKey(key: string): Observable<ApiResponse<Issue>> {
    return this.getIssues().pipe(
      map(response => {
        const issue = response.data?.find(i => i.key === key);
        return {
          ...response,
          data: issue || null
        };
      })
    );
  }
}

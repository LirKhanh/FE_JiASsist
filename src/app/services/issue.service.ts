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

  saveIssue(issue: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>('/api/issues', issue);
  }
}

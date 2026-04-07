import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProjectResponse {
  projectId: string;
  projectName: string;
  pmId: string;
  pmName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = '/api/projects';

  constructor(private http: HttpClient) { }

  getProjectsByUserId(userId: string): Observable<ApiResponse<ProjectResponse[]>> {
    return this.http.get<ApiResponse<ProjectResponse[]>>(`${this.apiUrl}?userId=${userId}`);
  }

  getProjectDetail(projectId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${projectId}`);
  }

  getIssuesByProjectId(projectId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${projectId}/issues`);
  }

  getIssueDetail(issueId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`/api/issues/${issueId}`);
  }
}

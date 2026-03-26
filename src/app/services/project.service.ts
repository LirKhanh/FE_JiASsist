import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Project {
  projectId: string;
  projectName: string;
  description: string;
  pmId: string;
  startDate: string;
  endDate: string;
  status: boolean;
  createdAt: Date;
  createdBy: string;
  updateAt: Date;
  updateBy: string;
  actionType?: string;
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
export class ProjectService {
  private apiUrl = '/api/admin/Project/project';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(this.apiUrl);
  }

  saveProject(project: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, project);
  }
}

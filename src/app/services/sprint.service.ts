import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './project.service';

export interface Sprint {
  sprintId: string;
  projectId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  status: boolean;
  createdAt?: Date;
  createdBy?: string;
  updateAt?: Date;
  updateBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private apiUrl = '/api/sprints';

  constructor(private http: HttpClient) { }

  getSprints(projectId: string): Observable<ApiResponse<Sprint[]>> {
    return this.http.get<ApiResponse<Sprint[]>>(`${this.apiUrl}?projectId=${projectId}`);
  }

  getSprint(sprintId: string, projectId: string): Observable<ApiResponse<Sprint>> {
    return this.http.get<ApiResponse<Sprint>>(`${this.apiUrl}/${sprintId}/${projectId}`);
  }

  createSprint(sprint: Sprint): Observable<ApiResponse<Sprint>> {
    return this.http.post<ApiResponse<Sprint>>(this.apiUrl, sprint);
  }

  updateSprint(sprintId: string, projectId: string, sprint: Sprint): Observable<ApiResponse<Sprint>> {
    return this.http.put<ApiResponse<Sprint>>(`${this.apiUrl}/${sprintId}/${projectId}`, sprint);
  }

  deleteSprint(sprintId: string, projectId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${sprintId}/${projectId}`);
  }
}

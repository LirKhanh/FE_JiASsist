import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = '/api/ProjectStatistics/';

  constructor(private http: HttpClient) { }

  getSprints(projectId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}sprints/${projectId}`);
  }

  getEpics(projectId: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}epics/${projectId}`);
  }

  evaluateSprint(projectId: string, sprintId: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}evaluate-sprint/${projectId}/${sprintId}`);
  }

  evaluateEpic(projectId: string, epicId: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}evaluate-epic/${projectId}/${epicId}`);
  }
}

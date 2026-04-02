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
export interface ComboboxRequest {
  queries: string[];
  keys: string[];
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
  private apiUrl = '/api/admin/Project/';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(this.apiUrl+'GetProject');
  }

  saveProject(data: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl+'AddOrEdit', data);
  }
  loadComboboxData(request: ComboboxRequest): Observable<ApiResponse<any>> {
      return this.http.post<ApiResponse<any>>(this.apiUrl+'LoadDataCombobox' , request);
    }
}
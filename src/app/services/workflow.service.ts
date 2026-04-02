import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface WorkflowStep {
  stepId: string;
  stepName: string;
  step: number;
  status: boolean;
  createdAt: Date;
  createdBy: string;
  updateAt: Date;
  updateBy: string;
  actionType?: string; // A: Add, E: Edit
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
export class WorkflowService {
  private apiUrl = '/api/admin/Workflow/';

  constructor(private http: HttpClient) { }

  getWorkflows(): Observable<ApiResponse<WorkflowStep[]>> {
    return this.http.get<ApiResponse<WorkflowStep[]>>(this.apiUrl+ 'GetWorkFlow');
  }

   saveWorkflow(data: Partial<WorkflowStep>): Observable<ApiResponse<WorkflowStep>> {                        
       return this.http.post<ApiResponse<WorkflowStep>>(this.apiUrl+'AddOrEdit', data);                                     
  }
  
  
}

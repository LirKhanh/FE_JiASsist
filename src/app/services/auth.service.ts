import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string;
}

export interface User {
  userId: string;
  username: string;
  email: string | null;
  fullname: string;
  roleId: string | null;
  status: boolean;
}

export interface WorkflowStep {
  stepId: string;
  stepName: string;
  step: number;
}

export interface IssuePriority {
  priorityId: string;
  priorityName: string;
}

export interface IssueTypes {
  typeId: string;
  typeName: string;
}

export interface LoginData {
  token: string;
  expiresAt: string;
  user: User;
  workflowStep: WorkflowStep[];
  issuePriorities: IssuePriority[];
  issueTypes: IssueTypes[];
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/Authentication';

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<ApiResponse<LoginData>> {
    return this.http.post<ApiResponse<LoginData>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveUserData(response.data);
        }
      })
    );
  }

  private saveUserData(data: LoginData) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('expiresAt', data.expiresAt);
    localStorage.setItem('workflowSteps', JSON.stringify(data.workflowStep));
    localStorage.setItem('issuePriorities', JSON.stringify(data.issuePriorities));
    localStorage.setItem('issueTypes', JSON.stringify(data.issueTypes));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('workflowSteps');
    localStorage.removeItem('issuePriorities');
    localStorage.removeItem('issueTypes');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    // Basic check, you might want to check expiration here
    return !!token;
  }

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

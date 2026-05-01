import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface DashboardSummaryData {
  projects: any[];
  dynamicFilters: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/Dashboard';

  constructor(private http: HttpClient) { }

  getDashboardSummary(userId: string): Observable<ApiResponse<DashboardSummaryData>> {
    return this.http.get<ApiResponse<DashboardSummaryData>>(`${this.apiUrl}/summary?userId=${userId}`);
  }
}

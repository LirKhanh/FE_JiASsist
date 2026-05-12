import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Filter {
  filterId?: string;
  type: string;
  strSql: string;
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
export class FilterService {
  private apiUrl = '/api/admin/Filter/';

  constructor(private http: HttpClient) { }

  getFilters(): Observable<ApiResponse<Filter[]>> {
    return this.http.get<ApiResponse<Filter[]>>(this.apiUrl + 'GetFilters');
  }

  getUserFilters(userId: string): Observable<ApiResponse<Filter[]>> {
    return this.http.get<ApiResponse<Filter[]>>(this.apiUrl + 'GetUserFilters/' + userId);
  }

  saveFilter(data: Partial<Filter>): Observable<ApiResponse<Filter>> {
    return this.http.post<ApiResponse<Filter>>(this.apiUrl + 'AddOrEdit', data);
  }

  deleteFilter(filterId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.apiUrl + 'Delete/' + filterId);
  }
}

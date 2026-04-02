import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
export class BaseService {
  private apiUrl = '/api/Base/';

  constructor(private http: HttpClient) { }

  loadComboboxData(request: ComboboxRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl+'LoadDataCombobox' , request);
  }
}

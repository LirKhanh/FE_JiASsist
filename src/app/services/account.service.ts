import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Account {
  userId?: string;
  username: string;
  password?: string;
  email: string;
  fullname: string;
  projectJoin?: string;
  status: boolean;
  createdAt?: Date;
  createdBy?: string;
  updateAt?: Date;
  updateBy?: string;
  adminYn: boolean;
  pmYn: boolean;
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
export class AccountService {
  private apiUrl = '/api/admin/Account/';

  constructor(private http: HttpClient) { }

  getAccounts(): Observable<ApiResponse<Account[]>> {
    return this.http.get<ApiResponse<Account[]>>(this.apiUrl + 'GetAccount');
  }

  saveAccount(data: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.http.post<ApiResponse<Account>>(this.apiUrl + 'AddOrEdit', data);
  }

  loadComboboxData(request: ComboboxRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl + 'LoadDataCombobox', request);
  }
}

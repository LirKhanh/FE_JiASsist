import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      const isLoginRequest = req.url.toLowerCase().includes('/auth/login');

      console.group('HTTP Error Interceptor');
      console.log('Status:', error.status);
      console.log('Is Login Request:', isLoginRequest);
      console.log('Error Body:', error.error);
      console.groupEnd();

      if (error.status === 401) {
        if (isLoginRequest) {
          // If it's a 401 on login, it's typically "Invalid credentials"
          // We extract the specific message provided by your API JSON structure
          errorMessage = error.error?.error || error.error?.message || 'Invalid username or password';
        } else {
          errorMessage = 'Your session has expired. Please login again.';
          authService.logout();
          router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'Requested resource not found.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to the server. Please check your internet connection.';
      } else {
        // Fallback for other errors: try to get message from API body
        if (error.error) {
          errorMessage = error.error.error || error.error.message || errorMessage;
        }
      }

      // Display notification through the global service
      notificationService.error(errorMessage);
      
      return throwError(() => error);
    })
  );
};

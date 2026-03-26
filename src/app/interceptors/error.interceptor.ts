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
      // Adjusting to match the actual login URL: /api/Authentication/login
      const isLoginRequest = req.url.toLowerCase().includes('/authentication/login');

      console.group('HTTP Error Interceptor');
      console.log('Status:', error.status);
      console.log('URL:', req.url);
      console.log('Is Login Request:', isLoginRequest);
      console.log('Error Body:', error.error);
      console.groupEnd();

      if (error.status === 401) {
        // Ưu tiên lấy từ trường 'error' trong JSON body (ví dụ: "Tài khoản không tồn tại...")
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (isLoginRequest) {
          errorMessage = 'Mật khẩu hoặc tài khoản không chính xác!';
        } else {
          errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
          authService.logout();
          router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        errorMessage = error.error?.error || 'Bạn không có quyền thực hiện hành động này.';
      } else if (error.status === 404) {
        errorMessage = error.error?.error || 'Không tìm thấy tài nguyên yêu cầu.';
      } else if (error.status === 0) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra internet.';
      } else {
        // Các lỗi khác (500, 400, v.v.)
        errorMessage = error.error?.error || error.error?.message || errorMessage;
      }

      // Display notification through the global service
      notificationService.error(errorMessage);
      
      return throwError(() => error);
    })
  );
};

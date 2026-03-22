import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;

      this.authService.login(this.loginForm.value)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.cdr.detectChanges(); // Ensure loading state is updated in UI
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.notificationService.success(response.message || 'Login successful!');
                this.router.navigate(['/dashboard']);
            } else {
              this.notificationService.error(response.error || response.message || 'Login failed');
            }
          },
          error: (error) => {
            this.notificationService.error(error.error?.message || error.error?.error || 'Login failed. Please try again.');
          }
        });
    } else {
      Object.keys(this.loginForm.controls).forEach(field => {
        const control = this.loginForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
    }
  }
}

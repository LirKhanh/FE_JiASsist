import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { RegisterComponent } from './components/register/register';
import { authGuard, loginGuard } from './guards/auth.guard';
import { AdminComponent } from './components/admin/admin';
import { AccountManagementComponent } from './components/admin/account-management/account-management';
import { ProjectManagementComponent } from './components/admin/project-management/project-management';
import { WorkflowManagementComponent } from './components/admin/workflow-management/workflow-management';
import { IssuesComponent } from './components/issues/issues';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [loginGuard] },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'issues', 
    component: IssuesComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [authGuard],
    children: [
      { path: 'accounts', component: AccountManagementComponent },
      { path: 'projects', component: ProjectManagementComponent },
      { path: 'workflow', component: WorkflowManagementComponent },
      { path: '', redirectTo: 'accounts', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

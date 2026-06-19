import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { VerifyOtpComponent } from './features/auth/verify-otp/verify-otp.component';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { UserManagementComponent } from './features/user-management/user-management.component';
import { AllRequestsComponent } from './features/all-request/all-request.component';
import { ApprovalsComponent } from './features/approval/approval.component';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },

  // Protected routes (ต้อง login)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'requests', component: AllRequestsComponent },
      {
        path: 'user-management',
        component: UserManagementComponent,
        canActivate: [roleGuard('ADMIN')],
      },
      {
        path: 'approvals',
        component: ApprovalsComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];

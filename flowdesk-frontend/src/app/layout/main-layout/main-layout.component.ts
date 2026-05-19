import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from '../../core/services/auth.service';

type UserRole = 'Admin' | 'Manager' | 'User';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  isSidebarOpen = true;
  activeRoute: string = 'dashboard';

  currentUser = {
    name: 'Nattapong',
    email: 'nattapong@gmail.com',
    role: 'Admin' as UserRole,
    avatar: 'N',
  };

  pendingApprovals: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadPendingApprovals();
    this.updateActiveRoute(this.router.url);

    this.router.events.subscribe(() => {
      this.updateActiveRoute(this.router.url);
    });
  }

  loadUserData(): void {
    const user = this.authService.getUser();
    if (user) {
      // ใช้ fullName หรือ firstName+lastName หรือ email แทน name
      this.currentUser.name =
        (user.firstName ? `${user.firstName} ${user.lastName}` : null) || user.email.split('@')[0];

      this.currentUser.email = user.email;
      this.currentUser.role = (user.role as UserRole) || 'Admin';
      this.currentUser.avatar = this.currentUser.name.charAt(0).toUpperCase();
    }
  }

  loadPendingApprovals(): void {
    this.pendingApprovals = [{ id: 'REQ-103' }, { id: 'REQ-104' }, { id: 'REQ-105' }];
  }

  updateActiveRoute(url: string): void {
    if (url.includes('dashboard')) this.activeRoute = 'dashboard';
    else if (url.includes('user-management')) this.activeRoute = 'user-management';
    else if (url.includes('requests')) this.activeRoute = 'requests';
    else if (url.includes('approvals')) this.activeRoute = 'approvals';
  }

  navigateTo(route: string): void {
    this.activeRoute = route;
    this.router.navigate([`/${route}`]);
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  canApprove(): boolean {
    return this.currentUser.role === 'Admin' || this.currentUser.role === 'Manager';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

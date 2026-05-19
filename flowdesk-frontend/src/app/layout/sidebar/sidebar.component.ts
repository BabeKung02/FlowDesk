import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  activeRoute: string = 'dashboard';
  pendingApprovals: any[] = [];
  currentUser: any = {
    role: 'Admin'
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Listen to route changes to update active state
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateActiveRoute(event.url);
      });

    // Set initial active route
    this.updateActiveRoute(this.router.url);

    // Load pending approvals count (you can inject a service here)
    this.loadPendingApprovals();
  }

  updateActiveRoute(url: string): void {
    if (url.includes('dashboard')) {
      this.activeRoute = 'dashboard';
    } else if (url.includes('user-management')) {
      this.activeRoute = 'user-management';
    } else if (url.includes('requests')) {
      this.activeRoute = 'requests';
    } else if (url.includes('approvals')) {
      this.activeRoute = 'approvals';
    }
  }

  navigateTo(route: string): void {
    this.activeRoute = route;
    this.router.navigate([`/${route}`]);
  }

  canApprove(): boolean {
    return this.currentUser.role === 'Admin' || this.currentUser.role === 'Manager';
  }

  loadPendingApprovals(): void {
    // Mock data - replace with actual service call
    this.pendingApprovals = [
      { id: 'REQ-103' },
      { id: 'REQ-104' },
      { id: 'REQ-105' }
    ];
  }
}
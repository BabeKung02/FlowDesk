import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

interface WorkflowStep {
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  approver?: string;
  completedDate?: Date;
}

interface MyRequest {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  currentStep: string;
  totalSteps: number;
  submittedDate: Date;
  lastUpdate: Date;
  priority: 'low' | 'medium' | 'high';
  workflow: WorkflowStep[];
  requestType: string;
  requester?: string;
  department?: string;
}

interface Activity {
  id: string;
  action: string;
  requestId: string;
  user: string;
  timestamp: Date;
  type: 'submitted' | 'approved' | 'rejected' | 'updated' | 'commented';
}

type UserRole = 'Admin' | 'Manager' | 'User';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  currentUser = {
    name: 'Nattapong',
    email: 'nattapong@gmail.com',
    role: 'Admin' as UserRole,
    avatar: 'N',
  };

  stats: StatCard[] = [];
  myRequests: MyRequest[] = [];
  recentActivities: Activity[] = [];
  allRequests: MyRequest[] = [];
  pendingApprovals: MyRequest[] = [];

  get highPriorityCount(): number {
    return this.pendingApprovals.filter((r) => r.priority === 'high').length;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadMockData();
    this.loadStats();
  }

  loadUserData(): void {
    const user = this.authService.getUser();
    if (user) {
      this.currentUser.name =
        (user.firstName ? `${user.firstName} ${user.lastName}` : null) ||
        user.email.split('@')[0];
      this.currentUser.email = user.email;
      this.currentUser.role = (user.role as UserRole) || 'Admin';
      this.currentUser.avatar = this.currentUser.name.charAt(0).toUpperCase();
    }
  }

  loadMockData(): void {
    this.allRequests = [
      {
        id: 'REQ-102',
        title: 'คำขอลาพักร้อน',
        description: 'ลาพักร้อน 5 วัน เพื่อท่องเที่ยวกับครอบครัว',
        status: 'in-progress',
        currentStep: 'อนุมัติโดยผู้จัดการ',
        totalSteps: 4,
        submittedDate: new Date(2026, 0, 10),
        lastUpdate: new Date(2026, 0, 11, 14, 30),
        priority: 'high',
        requestType: 'การลา',
        requester: 'Nattapong',
        department: 'IT',
        workflow: [
          { name: 'ส่งคำขอ', status: 'completed', completedDate: new Date(2026, 0, 10) },
          { name: 'อนุมัติผู้จัดการ', status: 'in-progress', approver: 'John Manager' },
          { name: 'อนุมัติ HR', status: 'pending' },
          { name: 'เสร็จสิ้น', status: 'pending' },
        ],
      },
      {
        id: 'REQ-101',
        title: 'คำขอจัดซื้ออุปกรณ์',
        description: 'โน้ตบุ๊กสำหรับงานพัฒนาซอฟต์แวร์',
        status: 'approved',
        currentStep: 'เสร็จสิ้น',
        totalSteps: 4,
        submittedDate: new Date(2026, 0, 8),
        lastUpdate: new Date(2026, 0, 10, 9, 15),
        priority: 'medium',
        requestType: 'จัดซื้อ',
        requester: 'Nattapong',
        department: 'IT',
        workflow: [
          { name: 'ส่งคำขอ', status: 'completed' },
          { name: 'อนุมัติผู้จัดการ', status: 'completed' },
          { name: 'อนุมัติการเงิน', status: 'completed' },
          { name: 'เสร็จสิ้น', status: 'completed' },
        ],
      },
      {
        id: 'REQ-099',
        title: 'คำขออนุมัติงบประมาณ',
        description: 'งบประมาณการตลาดไตรมาส 1',
        status: 'rejected',
        currentStep: 'อนุมัติการเงิน',
        totalSteps: 3,
        submittedDate: new Date(2026, 0, 5),
        lastUpdate: new Date(2026, 0, 7, 16, 45),
        priority: 'low',
        requestType: 'งบประมาณ',
        requester: 'Nattapong',
        department: 'การตลาด',
        workflow: [
          { name: 'ส่งคำขอ', status: 'completed' },
          { name: 'อนุมัติผู้จัดการ', status: 'completed' },
          { name: 'อนุมัติการเงิน', status: 'rejected' },
        ],
      },
      {
        id: 'REQ-103',
        title: 'คำขอวัสดุสำนักงาน',
        description: 'กระดาษและหมึกพิมพ์',
        status: 'pending',
        currentStep: 'อนุมัติผู้จัดการ',
        totalSteps: 3,
        submittedDate: new Date(2026, 0, 11, 10, 0),
        lastUpdate: new Date(2026, 0, 11, 10, 0),
        priority: 'high',
        requestType: 'จัดซื้อ',
        requester: 'John Doe',
        department: 'IT',
        workflow: [
          { name: 'ส่งคำขอ', status: 'completed' },
          { name: 'อนุมัติผู้จัดการ', status: 'pending' },
          { name: 'เสร็จสิ้น', status: 'pending' },
        ],
      },
      {
        id: 'REQ-104',
        title: 'คำของบประมาณอบรม',
        description: 'คอร์สอบรม Angular certification',
        status: 'pending',
        currentStep: 'อนุมัติผู้จัดการ',
        totalSteps: 3,
        submittedDate: new Date(2026, 0, 11, 8, 30),
        lastUpdate: new Date(2026, 0, 11, 8, 30),
        priority: 'medium',
        requestType: 'อบรม',
        requester: 'Jane Smith',
        department: 'HR',
        workflow: [
          { name: 'ส่งคำขอ', status: 'completed' },
          { name: 'อนุมัติผู้จัดการ', status: 'pending' },
          { name: 'เสร็จสิ้น', status: 'pending' },
        ],
      },
      {
        id: 'REQ-105',
        title: 'คำขออนุมัติทำงานล่วงเวลา',
        description: 'ทำงานวันหยุดสุดสัปดาห์เพื่อส่งโปรเจกต์',
        status: 'pending',
        currentStep: 'อนุมัติผู้จัดการ',
        totalSteps: 3,
        submittedDate: new Date(2026, 0, 10, 15, 45),
        lastUpdate: new Date(2026, 0, 10, 15, 45),
        priority: 'high',
        requestType: 'ล่วงเวลา',
        requester: 'Mike Johnson',
        department: 'ปฏิบัติการ',
        workflow: [
          { name: 'ส่งคำขอ', status: 'completed' },
          { name: 'อนุมัติผู้จัดการ', status: 'pending' },
          { name: 'เสร็จสิ้น', status: 'pending' },
        ],
      },
    ];

    this.recentActivities = [
      {
        id: '1',
        action: 'ส่งคำขอใหม่',
        requestId: 'REQ-106',
        user: 'Sarah Wilson',
        timestamp: new Date(2026, 0, 11, 15, 30),
        type: 'submitted',
      },
      {
        id: '2',
        action: 'อนุมัติคำขอ',
        requestId: 'REQ-101',
        user: 'ทีมการเงิน',
        timestamp: new Date(2026, 0, 11, 14, 15),
        type: 'approved',
      },
      {
        id: '3',
        action: 'ปฏิเสธคำขอ',
        requestId: 'REQ-099',
        user: 'ทีมการเงิน',
        timestamp: new Date(2026, 0, 11, 11, 0),
        type: 'rejected',
      },
      {
        id: '4',
        action: 'แสดงความคิดเห็นในคำขอ',
        requestId: 'REQ-102',
        user: 'John Manager',
        timestamp: new Date(2026, 0, 11, 9, 45),
        type: 'commented',
      },
    ];

    this.updateLists();
  }

  updateLists(): void {
    this.myRequests = this.allRequests.filter(
      (r) => r.requester === this.currentUser.name
    );
    this.pendingApprovals = this.canApprove()
      ? this.allRequests.filter(
          (r) => r.status === 'pending' && r.requester !== this.currentUser.name
        )
      : [];
  }

  loadStats(): void {
    const src = this.isAdmin() || this.isManager() ? this.allRequests : this.myRequests;
    this.stats = [
      {
        title: (this.canApprove() ? 'คำขอทั้งหมด' : 'คำขอของฉัน'),
        value: src.length,
        icon: 'description',
        color: '#3b82f6',
        bgColor: '#eff6ff',
      },
      {
        title: this.canApprove() ? 'รอการอนุมัติ' : 'กำลังดำเนินการ',
        value: this.canApprove()
          ? this.pendingApprovals.length
          : src.filter((r) => r.status === 'in-progress').length,
        icon: this.canApprove() ? 'pending_actions' : 'sync',
        color: '#f59e0b',
        bgColor: '#fffbeb',
      },
      {
        title: 'อนุมัติแล้ว',
        value: src.filter((r) => r.status === 'approved').length,
        icon: 'check_circle',
        color: '#10b981',
        bgColor: '#f0fdf4',
      },
      {
        title: 'ถูกปฏิเสธ',
        value: src.filter((r) => r.status === 'rejected').length,
        icon: 'cancel',
        color: '#ef4444',
        bgColor: '#fef2f2',
      },
    ];
  }

  isAdmin()   { return this.currentUser.role === 'Admin'; }
  isManager() { return this.currentUser.role === 'Manager'; }
  canApprove(){ return this.isAdmin() || this.isManager(); }

  // ─── Actions ─────────────────────────────────────────
  async createNewRequest(): Promise<void> {
    const { value: title } = await Swal.fire({
      title: 'สร้างคำขอใหม่',
      input: 'text',
      inputLabel: 'ชื่อคำขอ',
      inputPlaceholder: 'เช่น คำขอลาพักร้อน',
      showCancelButton: true,
      confirmButtonText: 'สร้าง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      inputValidator: (v) => (!v?.trim() ? 'กรุณากรอกชื่อคำขอ' : null),
    });
    if (!title) return;

    const newId = 'REQ-' + (Math.floor(Math.random() * 900) + 106);
    const req: MyRequest = {
      id: newId,
      title: title.trim(),
      description: '',
      status: 'pending',
      currentStep: 'อนุมัติผู้จัดการ',
      totalSteps: 3,
      submittedDate: new Date(),
      lastUpdate: new Date(),
      priority: 'medium',
      requestType: 'ทั่วไป',
      requester: this.currentUser.name,
      department: 'IT',
      workflow: [
        { name: 'ส่งคำขอ', status: 'completed', completedDate: new Date() },
        { name: 'อนุมัติผู้จัดการ', status: 'pending' },
        { name: 'เสร็จสิ้น', status: 'pending' },
      ],
    };

    this.allRequests.unshift(req);
    this.updateLists();
    this.loadStats();
    this.addActivity({
      id: Date.now().toString(),
      action: 'ส่งคำขอใหม่',
      requestId: newId,
      user: this.currentUser.name,
      timestamp: new Date(),
      type: 'submitted',
    });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `สร้าง ${newId} สำเร็จ`,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  }

  async editRequest(req: MyRequest): Promise<void> {
    if (req.status !== 'pending') return;
    const { value: title } = await Swal.fire({
      title: 'แก้ไขคำขอ',
      input: 'text',
      inputLabel: 'ชื่อคำขอ',
      inputValue: req.title,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      inputValidator: (v) => (!v?.trim() ? 'กรุณากรอกชื่อคำขอ' : null),
    });
    if (!title) return;

    req.title = title.trim();
    req.lastUpdate = new Date();
    this.addActivity({
      id: Date.now().toString(),
      action: 'แก้ไขคำขอ',
      requestId: req.id,
      user: this.currentUser.name,
      timestamp: new Date(),
      type: 'updated',
    });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'แก้ไขคำขอสำเร็จ',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }

  async deleteRequest(req: MyRequest): Promise<void> {
    if (req.status !== 'pending') return;
    const result = await Swal.fire({
      title: 'ยืนยันการลบคำขอ?',
      html: `<p style="color:#6b7280">ลบ <strong>${req.id}</strong> — "${req.title}"?<br>ไม่สามารถกู้คืนได้</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    this.allRequests = this.allRequests.filter((r) => r.id !== req.id);
    this.updateLists();
    this.loadStats();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'ลบคำขอสำเร็จ',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }

  viewRequest(id: string): void {
    const req = this.allRequests.find((r) => r.id === id);
    if (!req) return;
    Swal.fire({
      title: req.id,
      html: `
        <div style="text-align:left">
          <p style="font-weight:700;font-size:15px;color:#111827;margin-bottom:6px">${req.title}</p>
          <p style="color:#6b7280;font-size:13px">${req.description || '-'}</p>
          <hr style="margin:10px 0;border-color:#f3f4f6"/>
          <p style="font-size:13px"><strong>ผู้ส่งคำขอ:</strong> ${req.requester} · ${req.department}</p>
          <p style="font-size:13px"><strong>สถานะ:</strong> ${req.status} &nbsp;|&nbsp; <strong>ความสำคัญ:</strong> ${req.priority}</p>
        </div>`,
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#667eea',
    });
  }

  goToPendingApprovals(): void {
    this.router.navigate(['/approvals']);
  }

  addActivity(a: Activity): void {
    this.recentActivities.unshift(a);
    if (this.recentActivities.length > 8) this.recentActivities.pop();
  }

  // ─── Helpers ──────────────────────────────────────────
  getStatusIcon(s: string): string {
    return ({
      pending: 'schedule',
      approved: 'check_circle',
      rejected: 'cancel',
      'in-progress': 'sync',
      completed: 'check_circle',
    } as any)[s] || 'info';
  }

  getPriorityColor(p: string): string {
    return ({ high: '#ef4444', medium: '#f59e0b', low: '#10b981' } as any)[p] || '#6b7280';
  }

  getActivityIcon(t: string): string {
    return ({
      submitted: 'add_circle',
      approved: 'check_circle',
      rejected: 'cancel',
      updated: 'edit',
      commented: 'comment',
    } as any)[t] || 'info';
  }

  getActivityColor(t: string): string {
    return ({
      submitted: '#3b82f6',
      approved: '#10b981',
      rejected: '#ef4444',
      updated: '#f59e0b',
      commented: '#8b5cf6',
    } as any)[t] || '#6b7280';
  }

  getWorkflowProgress(req: MyRequest): number {
    return (
      (req.workflow.filter((s) => s.status === 'completed').length / req.workflow.length) * 100
    );
  }

  getRelativeTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1)    return 'ตอนนี้';
    if (diff < 60)   return `${diff} นาทีที่แล้ว`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 1440)} วันที่แล้ว`;
  }

  getDaysWaiting(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / 86400000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
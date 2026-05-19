import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

interface StatCard {
  title: string;
  value: number | string;
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

interface ApprovalRequest {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress';
  currentStep: string;
  submittedDate: Date;
  lastUpdate: Date;
  priority: 'low' | 'medium' | 'high';
  requestType: string;
  requester: string;
  department: string;
  workflow: WorkflowStep[];
}

interface HistoryRecord {
  id: string;
  title: string;
  requester: string;
  department: string;
  actionTaken: 'approved' | 'rejected';
  comment: string;
  actionDate: Date;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './approval.component.html',
  styleUrls: ['./approval.component.scss']
})
export class ApprovalsComponent implements OnInit {

  viewMode: 'pending' | 'history' = 'pending';
  historyColumns: string[] = ['id', 'title', 'requester', 'action', 'comment', 'actionDate'];

  stats: StatCard[] = [];
  pendingApprovals: ApprovalRequest[] = [];
  processingId = '';

  allHistory: HistoryRecord[] = [];
  filteredHistory: HistoryRecord[] = [];
  historySearch = '';
  historyFilter = 'all';

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadPending();
    this.loadHistory();
    this.loadStats();
  }

  loadPending(): void {
    this.pendingApprovals = [
      {
        id: 'REQ-105', title: 'Overtime Authorization', description: 'Weekend overtime for Q1 project deadline',
        status: 'pending', currentStep: 'Manager Approval', submittedDate: new Date(2026, 0, 10, 15, 45),
        lastUpdate: new Date(2026, 0, 10, 15, 45), priority: 'high', requestType: 'Overtime',
        requester: 'Mike Johnson', department: 'Operations',
        workflow: [
          { name: 'Submitted', status: 'completed' },
          { name: 'Manager Approval', status: 'pending', approver: 'Admin' },
          { name: 'Completed', status: 'pending' }
        ]
      },
      {
        id: 'REQ-104', title: 'Training Budget Request', description: 'Angular Advanced certification course - 2 days',
        status: 'pending', currentStep: 'Manager Approval', submittedDate: new Date(2026, 0, 11, 8, 30),
        lastUpdate: new Date(2026, 0, 11, 8, 30), priority: 'medium', requestType: 'Training',
        requester: 'Jane Smith', department: 'HR',
        workflow: [
          { name: 'Submitted', status: 'completed' },
          { name: 'Manager Approval', status: 'pending', approver: 'Admin' },
          { name: 'Finance Approval', status: 'pending' },
          { name: 'Completed', status: 'pending' }
        ]
      },
      {
        id: 'REQ-103', title: 'Office Supplies Request', description: 'A4 paper (10 reams) and toner cartridges',
        status: 'pending', currentStep: 'Manager Approval', submittedDate: new Date(2026, 0, 11, 10, 0),
        lastUpdate: new Date(2026, 0, 11, 10, 0), priority: 'low', requestType: 'Purchase',
        requester: 'John Doe', department: 'IT',
        workflow: [
          { name: 'Submitted', status: 'completed' },
          { name: 'Manager Approval', status: 'pending', approver: 'Admin' },
          { name: 'Completed', status: 'pending' }
        ]
      }
    ];
  }

  loadHistory(): void {
    this.allHistory = [
      { id: 'REQ-101', title: 'Equipment Purchase Request', requester: 'Nattapong', department: 'IT', actionTaken: 'approved', comment: 'Approved — budget available', actionDate: new Date(2026, 0, 10) },
      { id: 'REQ-099', title: 'Budget Approval Request', requester: 'Nattapong', department: 'Marketing', actionTaken: 'rejected', comment: 'Over Q1 budget cap', actionDate: new Date(2026, 0, 7) },
      { id: 'REQ-096', title: 'Travel Request - Bangkok', requester: 'Sara Lee', department: 'Sales', actionTaken: 'approved', comment: '', actionDate: new Date(2025, 11, 20) },
      { id: 'REQ-090', title: 'Leave Request - Sick Leave', requester: 'Tom Chan', department: 'Ops', actionTaken: 'approved', comment: '', actionDate: new Date(2025, 11, 5) },
    ];
    this.filteredHistory = [...this.allHistory];
  }

  loadStats(): void {
    const approvedCount = this.allHistory.filter(h => h.actionTaken === 'approved').length;
    const rejectedCount = this.allHistory.filter(h => h.actionTaken === 'rejected').length;
    this.stats = [
      { title: 'Pending Review', value: this.pendingApprovals.length, icon: 'pending_actions', color: '#f59e0b', bgColor: '#fffbeb' },
      { title: 'Approved (Total)', value: approvedCount, icon: 'check_circle', color: '#10b981', bgColor: '#f0fdf4' },
      { title: 'Rejected (Total)', value: rejectedCount, icon: 'cancel', color: '#ef4444', bgColor: '#fef2f2' },
      { title: 'Avg. Response', value: '1.2d', icon: 'bolt', color: '#667eea', bgColor: '#eef2ff' }
    ];
  }

  // ─── Approve with SweetAlert2 ──────────────────────────────────────
  async approveRequest(item: ApprovalRequest): Promise<void> {
    const result = await Swal.fire({
      title: 'Approve Request?',
      html: `
        <div style="text-align:left; padding: 4px 0">
          <div style="font-size:13px; color:#6b7280; margin-bottom:4px">${item.id} · ${item.requestType}</div>
          <div style="font-weight:600; color:#111827; font-size:15px; margin-bottom:12px">${item.title}</div>
          <div style="font-size:13px; color:#374151">Requested by <strong>${item.requester}</strong> · ${item.department}</div>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Comment (optional)',
      inputPlaceholder: 'Add a note or reason...',
      inputAttributes: { rows: '2', style: 'font-size:14px; font-family: inherit; resize:none' },
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusConfirm: false,
    });

    if (!result.isConfirmed) return;

    this.processingId = item.id;
    const comment = result.value || '';
    this._doApprove(item, comment);
  }

  // ─── Reject with SweetAlert2 ───────────────────────────────────────
  async rejectRequest(item: ApprovalRequest): Promise<void> {
    const result = await Swal.fire({
      title: 'Reject Request?',
      html: `
        <div style="text-align:left; padding: 4px 0">
          <div style="font-size:13px; color:#6b7280; margin-bottom:4px">${item.id} · ${item.requestType}</div>
          <div style="font-weight:600; color:#111827; font-size:15px; margin-bottom:12px">${item.title}</div>
          <div style="font-size:13px; color:#374151">Requested by <strong>${item.requester}</strong> · ${item.department}</div>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Please provide a reason...',
      inputAttributes: { rows: '2', style: 'font-size:14px; font-family: inherit; resize:none' },
      inputValidator: (value) => {
        if (!value || !value.trim()) return 'Please provide a rejection reason';
        return null;
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    this.processingId = item.id;
    const comment = result.value || '';
    this._doReject(item, comment);
  }

  // ─── Approve All with SweetAlert2 ────────────────────────────────
  async approveAll(): Promise<void> {
    const result = await Swal.fire({
      title: `Approve All ${this.pendingApprovals.length} Requests?`,
      text: 'This will approve all pending requests at once.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Approve All`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;
    const copy = [...this.pendingApprovals];
    copy.forEach(item => this._doApprove(item, 'Bulk approved'));
  }

  private _doApprove(item: ApprovalRequest, comment: string): void {
    const activeIdx = item.workflow.findIndex(s => s.status === 'pending');
    if (activeIdx !== -1) {
      item.workflow[activeIdx].status = 'completed';
      item.workflow[activeIdx].completedDate = new Date();
      if (activeIdx + 1 < item.workflow.length) {
        item.workflow[activeIdx + 1].status = 'in-progress';
        item.currentStep = item.workflow[activeIdx + 1].name;
        item.status = 'in-progress';
      } else {
        item.status = 'approved';
        item.currentStep = 'Completed';
      }
    }

    this.allHistory.unshift({
      id: item.id, title: item.title, requester: item.requester,
      department: item.department, actionTaken: 'approved', comment, actionDate: new Date()
    });
    this.filterHistory();

    if (item.status === 'approved') {
      setTimeout(() => {
        this.pendingApprovals = this.pendingApprovals.filter(r => r.id !== item.id);
        this.processingId = '';
        this.loadStats();
      }, 400);
    } else {
      this.processingId = '';
      this.loadStats();
    }

    Swal.fire({
      toast: true, position: 'top-end', icon: 'success',
      title: `Request ${item.id} approved`, showConfirmButton: false, timer: 2500, timerProgressBar: true
    });
  }

  private _doReject(item: ApprovalRequest, comment: string): void {
    const activeIdx = item.workflow.findIndex(s => s.status === 'pending' || s.status === 'in-progress');
    if (activeIdx !== -1) {
      item.workflow[activeIdx].status = 'rejected';
      item.workflow[activeIdx].completedDate = new Date();
    }
    item.status = 'rejected';

    this.allHistory.unshift({
      id: item.id, title: item.title, requester: item.requester,
      department: item.department, actionTaken: 'rejected', comment, actionDate: new Date()
    });
    this.filterHistory();

    setTimeout(() => {
      this.pendingApprovals = this.pendingApprovals.filter(r => r.id !== item.id);
      this.processingId = '';
      this.loadStats();
    }, 400);

    Swal.fire({
      toast: true, position: 'top-end', icon: 'error',
      title: `Request ${item.id} rejected`, showConfirmButton: false, timer: 2500, timerProgressBar: true
    });
  }

  filterHistory(): void {
    let result = [...this.allHistory];
    if (this.historySearch.trim()) {
      const term = this.historySearch.toLowerCase();
      result = result.filter(h =>
        h.id.toLowerCase().includes(term) ||
        h.title.toLowerCase().includes(term) ||
        h.requester.toLowerCase().includes(term)
      );
    }
    if (this.historyFilter !== 'all') {
      result = result.filter(h => h.actionTaken === this.historyFilter);
    }
    this.filteredHistory = result;
  }

  getActiveStepIndex(item: ApprovalRequest): number {
    return item.workflow.findIndex(s => s.status === 'pending' || s.status === 'in-progress');
  }

  getDaysWaiting(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  viewRequestDetail(item: ApprovalRequest): void {
    Swal.fire({
      title: item.id,
      html: `
        <div style="text-align:left">
          <p style="font-size:16px;font-weight:600;color:#111827">${item.title}</p>
          <p style="color:#6b7280;font-size:13px">${item.description || ''}</p>
          <hr style="margin:12px 0;border-color:#f3f4f6"/>
          <p style="font-size:13px"><strong>Requester:</strong> ${item.requester} · ${item.department}</p>
          <p style="font-size:13px"><strong>Type:</strong> ${item.requestType} &nbsp;|&nbsp; <strong>Priority:</strong> ${item.priority}</p>
        </div>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: '#667eea',
    });
  }
}
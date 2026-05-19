import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import Swal from 'sweetalert2';

type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in-progress'
  | 'completed';

type PriorityLevel =
  | 'สูง'
  | 'ปานกลาง'
  | 'ต่ำ';

type SortDirection = 'asc' | 'desc';

type FilterValue = 'all' | string;

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

interface WorkflowStep {
  name: string;
  status: RequestStatus;
  approver?: string;
  completedDate?: Date;
}

interface Request {
  id: string;
  title: string;
  description?: string;
  status: RequestStatus;
  currentStep: string;
  submittedDate: Date;
  lastUpdate: Date;
  priority: PriorityLevel;
  requestType: string;
  requester: string;
  department: string;
  workflow: WorkflowStep[];
}

@Component({
  selector: 'app-all-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MaterialModule,
  ],
  templateUrl:
    './all-request.component.html',
  styleUrls: [
    './all-request.component.scss',
  ],
})
export class AllRequestsComponent
  implements OnInit
{
  allRequests: Request[] = [];

  filteredRequests: Request[] = [];

  stats: StatCard[] = [];

  readonly STATUS_LABELS: Record<
    RequestStatus,
    string
  > = {
    pending: 'รอดำเนินการ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ถูกปฏิเสธ',
    'in-progress':
      'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
  };

  readonly STATUS_ICONS: Record<
    RequestStatus,
    string
  > = {
    pending: 'schedule',
    approved: 'check_circle',
    rejected: 'cancel',
    'in-progress': 'sync',
    completed: 'check_circle',
  };

  readonly PRIORITY_ORDER: Record<
    PriorityLevel,
    number
  > = {
    สูง: 3,
    ปานกลาง: 2,
    ต่ำ: 1,
  };

  readonly PRIORITY_CLASS: Record<
    PriorityLevel,
    string
  > = {
    สูง: 'priority-high',
    ปานกลาง:
      'priority-medium',
    ต่ำ: 'priority-low',
  };

  readonly requestTypes: string[] = [
    'การลา',
    'จัดซื้อ',
    'งบประมาณ',
    'อบรม',
    'เดินทาง',
    'ล่วงเวลา',
    'ทั่วไป',
  ];

  // ======================
  // FILTER
  // ======================

  searchTerm = '';

  filterStatus: FilterValue =
    'all';

  filterType: FilterValue = 'all';

  filterPriority: FilterValue =
    'all';

  // ======================
  // SORT
  // ======================

  sortField: keyof Request | '' =
    '';

  sortDir: SortDirection = 'asc';

  // ======================
  // PAGINATION
  // ======================

  currentPage = 1;

  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(
      this.filteredRequests.length /
        this.pageSize,
    );
  }

  get paginatedRequests(): Request[] {
    const start =
      (this.currentPage - 1) *
      this.pageSize;

    return this.filteredRequests.slice(
      start,
      start + this.pageSize,
    );
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  // ======================
  // FILTER
  // ======================

  applyFilters(): void {
    let requests = [
      ...this.allRequests,
    ];

    requests =
      this.filterBySearch(
        requests,
      );

    requests =
      this.filterByStatus(
        requests,
      );

    requests =
      this.filterByType(
        requests,
      );

    requests =
      this.filterByPriority(
        requests,
      );

    if (this.sortField) {
      requests =
        this.sortList(requests);
    }

    this.filteredRequests = requests;

    this.currentPage = 1;

    this.loadStats();
  }

  filterBySearch(
    requests: Request[],
  ): Request[] {
    if (!this.searchTerm.trim()) {
      return requests;
    }

    const term =
      this.searchTerm.toLowerCase();

    return requests.filter(
      (request) =>
        request.id
          .toLowerCase()
          .includes(term) ||
        request.title
          .toLowerCase()
          .includes(term) ||
        request.requester
          .toLowerCase()
          .includes(term) ||
        request.department
          .toLowerCase()
          .includes(term),
    );
  }

  filterByStatus(
    requests: Request[],
  ): Request[] {
    if (
      this.filterStatus === 'all'
    ) {
      return requests;
    }

    return requests.filter(
      (request) =>
        request.status ===
        this.filterStatus,
    );
  }

  filterByType(
    requests: Request[],
  ): Request[] {
    if (this.filterType === 'all') {
      return requests;
    }

    return requests.filter(
      (request) =>
        request.requestType ===
        this.filterType,
    );
  }

  filterByPriority(
    requests: Request[],
  ): Request[] {
    if (
      this.filterPriority ===
      'all'
    ) {
      return requests;
    }

    return requests.filter(
      (request) =>
        request.priority ===
        this.filterPriority,
    );
  }

  clearFilters(): void {
    this.searchTerm = '';

    this.filterStatus = 'all';

    this.filterType = 'all';

    this.filterPriority = 'all';

    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return (
      this.searchTerm !== '' ||
      this.filterStatus !==
        'all' ||
      this.filterType !== 'all' ||
      this.filterPriority !==
        'all'
    );
  }

  // ======================
  // SORT
  // ======================

  sortBy(field: keyof Request): void {
    if (this.sortField === field) {
      this.sortDir =
        this.sortDir === 'asc'
          ? 'desc'
          : 'asc';
    } else {
      this.sortField = field;

      this.sortDir = 'asc';
    }

    this.applyFilters();
  }

  sortList(
    list: Request[],
  ): Request[] {
    const direction =
      this.sortDir === 'asc'
        ? 1
        : -1;

    return [...list].sort(
      (a, b) => {
        const valueA =
          a[
            this
              .sortField as keyof Request
          ];

        const valueB =
          b[
            this
              .sortField as keyof Request
          ];

        if (
          this.sortField ===
          'priority'
        ) {
          return (
            (this.PRIORITY_ORDER[
              valueA as PriorityLevel
            ] -
              this.PRIORITY_ORDER[
                valueB as PriorityLevel
              ]) *
            direction
          );
        }

        if (
          valueA instanceof Date &&
          valueB instanceof Date
        ) {
          return (
            (valueA.getTime() -
              valueB.getTime()) *
            direction
          );
        }

        return (
          String(
            valueA,
          ).localeCompare(
            String(valueB),
          ) * direction
        );
      },
    );
  }

  // ======================
  // PAGINATION
  // ======================

  changePage(
    direction: number,
  ): void {
    this.currentPage = Math.min(
      Math.max(
        1,
        this.currentPage +
          direction,
      ),
      this.totalPages,
    );
  }

  // ======================
  // HELPERS
  // ======================

  getStatusLabel(
    status: RequestStatus,
  ): string {
    return this.STATUS_LABELS[
      status
    ];
  }

  getStatusIcon(
    status: RequestStatus,
  ): string {
    return this.STATUS_ICONS[
      status
    ];
  }

  getFilterStatusLabel(
    status: string,
  ): string {
    if (status === 'all') {
      return 'ทั้งหมด';
    }

    return this.STATUS_LABELS[
      status as RequestStatus
    ];
  }

  getPriorityClass(
    priority: PriorityLevel,
  ): string {
    return this.PRIORITY_CLASS[
      priority
    ];
  }

  getRelativeTime(
    date: Date,
  ): string {
    const diffMinutes =
      Math.floor(
        (Date.now() -
          date.getTime()) /
          60000,
      );

    if (diffMinutes < 1) {
      return 'เมื่อสักครู่';
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} นาทีที่แล้ว`;
    }

    if (diffMinutes < 1440) {
      return `${Math.floor(
        diffMinutes / 60,
      )} ชั่วโมงที่แล้ว`;
    }

    return `${Math.floor(
      diffMinutes / 1440,
    )} วันที่แล้ว`;
  }

  getWorkflowProgress(
    request: Request,
  ): number {
    const completedSteps =
      request.workflow.filter(
        (step) =>
          step.status ===
          'completed',
      ).length;

    return (
      (completedSteps /
        request.workflow.length) *
      100
    );
  }

  // ======================
  // DATA
  // ======================

  loadRequests(): void {
    this.allRequests = [
      {
        id: 'REQ-105',
        title:
          'คำขออนุมัติทำงานล่วงเวลา',
        description:
          'ทำงานวันหยุดสุดสัปดาห์เพื่อส่งงานไตรมาส 1',
        status: 'pending',
        currentStep:
          'อนุมัติผู้จัดการ',
        submittedDate: new Date(
          2026,
          0,
          10,
          15,
          45,
        ),
        lastUpdate: new Date(
          2026,
          0,
          10,
          15,
          45,
        ),
        priority: 'สูง',
        requestType:
          'ล่วงเวลา',
        requester:
          'Mike Johnson',
        department:
          'ปฏิบัติการ',
        workflow: [
          {
            name: 'ส่งคำขอ',
            status:
              'completed',
          },
          {
            name:
              'อนุมัติผู้จัดการ',
            status: 'pending',
          },
        ],
      },
      {
        id: 'REQ-104',
        title:
          'คำของบประมาณอบรม',
        description:
          'คอร์สอบรม Angular Certification',
        status: 'pending',
        currentStep:
          'อนุมัติผู้จัดการ',
        submittedDate: new Date(
          2026,
          0,
          11,
          8,
          30,
        ),
        lastUpdate: new Date(
          2026,
          0,
          11,
          8,
          30,
        ),
        priority: 'ปานกลาง',
        requestType: 'อบรม',
        requester: 'Jane Smith',
        department:
          'ฝ่ายบุคคล',
        workflow: [
          {
            name: 'ส่งคำขอ',
            status:
              'completed',
          },
          {
            name:
              'อนุมัติผู้จัดการ',
            status: 'pending',
          },
        ],
      },
    ];

    this.applyFilters();
  }

  loadStats(): void {
    this.stats = [
      {
        title:
          'คำขอทั้งหมด',
        value:
          this.filteredRequests
            .length,
        icon: 'description',
        color: '#3b82f6',
        bgColor: '#eff6ff',
      },
      {
        title:
          'รอดำเนินการ',
        value:
          this.filteredRequests.filter(
            (request) =>
              request.status ===
              'pending',
          ).length,
        icon:
          'pending_actions',
        color: '#f59e0b',
        bgColor: '#fffbeb',
      },
      {
        title:
          'กำลังดำเนินการ',
        value:
          this.filteredRequests.filter(
            (request) =>
              request.status ===
              'in-progress',
          ).length,
        icon: 'sync',
        color: '#667eea',
        bgColor: '#eef2ff',
      },
      {
        title:
          'อนุมัติแล้ว',
        value:
          this.filteredRequests.filter(
            (request) =>
              request.status ===
                'approved' ||
              request.status ===
                'completed',
          ).length,
        icon:
          'check_circle',
        color: '#10b981',
        bgColor: '#f0fdf4',
      },
    ];
  }

  // ======================
  // ACTIONS
  // ======================

  viewRequest(
    request: Request,
  ): void {
    Swal.fire({
      title: request.id,
      html: `
        <div style="text-align:left">

          <p style="font-weight:600;font-size:15px;color:#111827;margin-bottom:6px">
            ${request.title}
          </p>

          <p style="color:#6b7280;font-size:13px;margin-bottom:12px">
            ${
              request.description ||
              'ไม่มีรายละเอียด'
            }
          </p>

          <p style="font-size:13px">
            <strong>ผู้ร้องขอ:</strong>
            ${request.requester}
            ·
            ${request.department}
          </p>

          <p style="font-size:13px">
            <strong>ความสำคัญ:</strong>
            ${request.priority}

            &nbsp;|&nbsp;

            <strong>สถานะ:</strong>
            ${this.getStatusLabel(
              request.status,
            )}
          </p>

          <p style="font-size:13px">
            <strong>ประเภทคำขอ:</strong>
            ${request.requestType}
          </p>

        </div>
      `,
      confirmButtonText: 'ปิด',
      confirmButtonColor:
        '#667eea',
    });
  }

  editRequest(
    request: Request,
  ): void {
    if (
      request.status !==
      'pending'
    ) {
      return;
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: `กำลังแก้ไข ${request.id}...`,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }

  async deleteRequest(
    request: Request,
  ): Promise<void> {
    if (
      request.status !==
      'pending'
    ) {
      return;
    }

    const result =
      await Swal.fire({
        title:
          'ยืนยันการลบคำขอ',
        html: `
          <p style="color:#6b7280">
            คุณต้องการลบ
            <strong>${request.id}</strong>
            หรือไม่?
            <br>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText:
          'ยกเลิก',
        confirmButtonColor:
          '#ef4444',
        cancelButtonColor:
          '#6b7280',
        reverseButtons: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    this.allRequests =
      this.allRequests.filter(
        (item) =>
          item.id !== request.id,
      );

    this.applyFilters();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title:
        'ลบคำขอสำเร็จ',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }

  createNewRequest(): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title:
        'กำลังเปิดฟอร์มสร้างคำขอใหม่...',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }

  exportCSV(): void {
    const headers = [
      'เลขคำขอ',
      'หัวข้อคำขอ',
      'ประเภท',
      'ผู้ร้องขอ',
      'แผนก',
      'ความสำคัญ',
      'สถานะ',
      'วันที่ส่ง',
    ];

    const escapeCSV = (
      value: unknown,
    ): string => {
      return `"${String(
        value,
      ).replace(
        /"/g,
        '""',
      )}"`;
    };

    const rows =
      this.filteredRequests.map(
        (request) => [
          request.id,
          request.title,
          request.requestType,
          request.requester,
          request.department,
          request.priority,
          this.getStatusLabel(
            request.status,
          ),
          request.submittedDate.toLocaleDateString(
            'th-TH',
          ),
        ],
      );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(escapeCSV)
          .join(','),
      )
      .join('\n');

    const blob = new Blob(
      ['\uFEFF' + csvContent],
      {
        type: 'text/csv;charset=utf-8;',
      },
    );

    const link =
      document.createElement('a');

    link.href =
      URL.createObjectURL(blob);

    link.download =
      'คำขอทั้งหมด.csv';

    link.click();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title:
        'ส่งออกไฟล์ CSV สำเร็จ',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }
}
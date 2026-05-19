import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { formatDistanceToNow } from 'date-fns';
import Swal from 'sweetalert2';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  joinedDate: Date;
}

export interface SummaryStat {
  label: string;
  value: number;
  color: string;
}

export interface RoleOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [
    {
      id: 'USR-001',
      name: 'Somchai Jaidee',
      email: 'somchai.j@company.co.th',
      role: 'admin',
      department: 'IT',
      status: 'active',
      joinedDate: new Date('2022-03-14'),
    },
    {
      id: 'USR-002',
      name: 'Nattaporn Wanit',
      email: 'nattaporn.w@company.co.th',
      role: 'manager',
      department: 'HR',
      status: 'active',
      joinedDate: new Date('2021-07-01'),
    },
    {
      id: 'USR-003',
      name: 'Parichat Ruangkul',
      email: 'parichat.r@company.co.th',
      role: 'user',
      department: 'Finance',
      status: 'active',
      joinedDate: new Date('2023-01-15'),
    },
    {
      id: 'USR-004',
      name: 'Krit Suwanpong',
      email: 'krit.s@company.co.th',
      role: 'user',
      department: 'Operations',
      status: 'inactive',
      joinedDate: new Date('2022-11-10'),
    },
    {
      id: 'USR-005',
      name: 'Malee Thongdee',
      email: 'malee.t@company.co.th',
      role: 'manager',
      department: 'Procurement',
      status: 'active',
      joinedDate: new Date('2020-05-20'),
    },
    {
      id: 'USR-006',
      name: 'Anan Prachaploi',
      email: 'anan.p@company.co.th',
      role: 'viewer',
      department: 'Audit',
      status: 'pending',
      joinedDate: new Date('2024-02-01'),
    },
    {
      id: 'USR-007',
      name: 'Sawitree Kamnan',
      email: 'sawitree.k@company.co.th',
      role: 'user',
      department: 'IT',
      status: 'active',
      joinedDate: new Date('2023-08-22'),
    },
    {
      id: 'USR-008',
      name: 'Theerawut Chaiyarak',
      email: 'theerawut.c@company.co.th',
      role: 'admin',
      department: 'IT',
      status: 'active',
      joinedDate: new Date('2019-12-05'),
    },
  ];

  filteredUsers: User[] = [];

  availableRoles: RoleOption[] = [
    { value: 'admin',   label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'user',    label: 'User' },
    { value: 'viewer',  label: 'Viewer' },
  ];

  availableDepartments: string[] = [];

  private readonly roleIconMap: Record<string, string> = {
    admin:   'security',
    manager: 'manage_accounts',
    user:    'person',
    viewer:  'visibility',
  };

  private readonly avatarGradients: string[] = [
    'linear-gradient(135deg,#f0883e,#e55c00)',
    'linear-gradient(135deg,#58a6ff,#1f6feb)',
    'linear-gradient(135deg,#3fb950,#1a7f37)',
    'linear-gradient(135deg,#a371f7,#6e40c9)',
    'linear-gradient(135deg,#f85149,#b91c1c)',
    'linear-gradient(135deg,#d29922,#a16207)',
    'linear-gradient(135deg,#39d353,#1a7f37)',
    'linear-gradient(135deg,#e06c75,#be185d)',
  ];

  searchQuery      = '';
  filterRole       = '';
  filterDepartment = '';
  filterStatus     = '';
  sortField        = 'name';
  sortDir: 'asc' | 'desc' = 'asc';
  viewMode: 'table' | 'card' = 'table';
  currentPage = 1;
  pageSize    = 20;
  totalPages  = 1;

  selectedIds = new Set<string>();
  allSelected = false;

  /** id ของ row ที่ dropdown role กำลังเปิดอยู่ */
  roleDropdownId: string | null = null;

  summaryStats: SummaryStat[] = [];

  // ── Swal shared config ────────────────────────────────────────────────────
  private readonly swalBase = {
    background: '#161b22',
    color: '#e6edf3',
    confirmButtonColor: '#58a6ff',
    cancelButtonColor: '#21262d',
    customClass: {
      popup:         'swal-um-popup',
      title:         'swal-um-title',
      htmlContainer: 'swal-um-html',
      confirmButton: 'swal-um-confirm',
      cancelButton:  'swal-um-cancel',
    },
  };

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.availableDepartments = [...new Set(this.users.map((u) => u.department))].sort();
    this.buildStats();
    this.applyFilters();
  }

  // ── Role Dropdown ─────────────────────────────────────────────────────────

  toggleRoleDropdown(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.roleDropdownId = this.roleDropdownId === id ? null : id;
  }

  confirmRoleChange(user: User, newRole: string): void {
    user.role = newRole as User['role'];
    this.roleDropdownId = null;
    this.buildStats();
    this.notify(`เปลี่ยน Role ของ ${user.name} เป็น ${this.getRoleLabel(newRole)} สำเร็จ`);
  }

  /** ปิด dropdown เมื่อคลิกนอก */
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.um-role-dropdown')) {
      this.roleDropdownId = null;
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  buildStats(): void {
    this.summaryStats = [
      { label: 'Total Users',   value: this.users.length,                                      color: '#7d8590' },
      { label: 'Active',        value: this.users.filter((u) => u.status === 'active').length,  color: '#3fb950' },
      { label: 'Inactive',      value: this.users.filter((u) => u.status === 'inactive').length,color: '#484f58' },
      { label: 'Pending',       value: this.users.filter((u) => u.status === 'pending').length, color: '#a371f7' },
      { label: 'Administrators',value: this.users.filter((u) => u.role === 'admin').length,     color: '#f0883e' },
    ];
  }

  // ── Filters / Sort / Pagination ───────────────────────────────────────────

  applyFilters(): void {
    let result = [...this.users];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q),
      );
    }
    if (this.filterRole)       result = result.filter((u) => u.role === this.filterRole);
    if (this.filterDepartment) result = result.filter((u) => u.department === this.filterDepartment);
    if (this.filterStatus)     result = result.filter((u) => u.status === this.filterStatus);

    result.sort((a, b) => {
      let vA: any = a[this.sortField as keyof User];
      let vB: any = b[this.sortField as keyof User];
      if (vA instanceof Date) {
        vA = vA.getTime();
        vB = (vB as Date).getTime();
      } else if (typeof vA === 'string') {
        vA = vA.toLowerCase();
        vB = (vB as string).toLowerCase();
      }
      return this.sortDir === 'asc'
        ? vA > vB ? 1 : vA < vB ? -1 : 0
        : vA < vB ? 1 : vA > vB ? -1 : 0;
    });

    this.totalPages   = Math.ceil(result.length / this.pageSize);
    this.filteredUsers = result.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
    this.buildStats();
  }

  sortBy(field: string): void {
    this.sortDir   = this.sortField === field ? (this.sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    this.sortField = field;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = this.filterRole = this.filterDepartment = this.filterStatus = '';
    this.applyFilters();
  }

  changePage(delta: number): void {
    this.currentPage = Math.max(1, Math.min(this.totalPages, this.currentPage + delta));
    this.applyFilters();
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  toggleSelect(id: string): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
    this.allSelected = this.filteredUsers.every((u) => this.selectedIds.has(u.id));
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filteredUsers.forEach((u) =>
      checked ? this.selectedIds.add(u.id) : this.selectedIds.delete(u.id),
    );
    this.allSelected = checked;
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.allSelected = false;
  }

  // ── Edit User (SweetAlert2) ───────────────────────────────────────────────

  async editUser(user: User): Promise<void> {
    const initials = this.getInitials(user.name);
    const gradient = this.getAvatarGradient(user.name);

    const roleOptions = this.availableRoles
      .map((r) => `<option value="${r.value}" ${r.value === user.role ? 'selected' : ''}>${r.label}</option>`)
      .join('');

    const { value: formValues } = await Swal.fire({
      ...this.swalBase,
      title: 'แก้ไขข้อมูลพนักงาน',
      width: 520,
      html: `
        <div class="swal-um-user-header">
          <div class="swal-um-avatar" style="background:${gradient}">${initials}</div>
          <div class="swal-um-user-id">${user.id}</div>
        </div>
        <div class="swal-um-form">
          <div class="swal-um-field">
            <label>ชื่อ-นามสกุล</label>
            <input id="swal-name" class="swal-um-input" value="${user.name}" placeholder="Full name" />
          </div>
          <div class="swal-um-field">
            <label>อีเมล</label>
            <input id="swal-email" class="swal-um-input" type="email" value="${user.email}" placeholder="Email" />
          </div>
          <div class="swal-um-row">
            <div class="swal-um-field">
              <label>แผนก</label>
              <input id="swal-dept" class="swal-um-input" value="${user.department}" placeholder="Department" />
            </div>
            <div class="swal-um-field">
              <label>Role</label>
              <select id="swal-role" class="swal-um-select">${roleOptions}</select>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      focusConfirm: false,
      preConfirm: () => {
        const name  = (document.getElementById('swal-name')  as HTMLInputElement).value.trim();
        const email = (document.getElementById('swal-email') as HTMLInputElement).value.trim();
        const dept  = (document.getElementById('swal-dept')  as HTMLInputElement).value.trim();
        const role  = (document.getElementById('swal-role')  as HTMLSelectElement).value;
        if (!name || !email) {
          Swal.showValidationMessage('กรุณากรอกชื่อและอีเมล');
          return false;
        }
        return { name, email, department: dept, role };
      },
    });

    if (formValues) {
      const idx = this.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) this.users[idx] = { ...this.users[idx], ...formValues } as User;
      this.applyFilters();
      this.notify(`บันทึกข้อมูล ${formValues.name} สำเร็จ`);
    }
  }

  // ── Remove User (SweetAlert2) ─────────────────────────────────────────────

  async removeUser(user: User): Promise<void> {
    const gradient = this.getAvatarGradient(user.name);
    const initials  = this.getInitials(user.name);

    const result = await Swal.fire({
      ...this.swalBase,
      title: 'ลบข้อมูลพนักงาน',
      width: 420,
      html: `
        <div class="swal-um-delete-card">
          <div class="swal-um-avatar sm" style="background:${gradient}">${initials}</div>
          <div>
            <div class="swal-um-delete-name">${user.name}</div>
            <div class="swal-um-delete-email">${user.email}</div>
          </div>
        </div>
        <p class="swal-um-delete-warn">
          คุณต้องการลบ <strong>${user.name}</strong> ออกจากระบบหรือไม่?<br>
          <span style="color:#484f58;font-size:12px">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#f85149',
      customClass: {
        ...this.swalBase.customClass,
        confirmButton: 'swal-um-confirm-danger',
      },
    });

    if (result.isConfirmed) {
      this.users = this.users.filter((u) => u.id !== user.id);
      this.selectedIds.delete(user.id);
      this.applyFilters();
      this.notify(`ลบข้อมูล ${user.name} สำเร็จ`);
    }
  }

  // ── Bulk Actions ──────────────────────────────────────────────────────────

  async openInviteDialog(): Promise<void> {
    const roleOptions = this.availableRoles
      .map((r) => `<option value="${r.value}">${r.label}</option>`)
      .join('');

    const deptOptions = this.availableDepartments
      .map((d) => `<option value="${d}">${d}</option>`)
      .join('');

    const { value: formValues } = await Swal.fire({
      ...this.swalBase,
      title: 'เพิ่มผู้ใช้งานใหม่',
      width: 520,
      html: `
        <div class="swal-um-form">
          <div class="swal-um-row">
            <div class="swal-um-field">
              <label>ชื่อ</label>
              <input id="inv-firstname" class="swal-um-input" placeholder="ชื่อ" />
            </div>
            <div class="swal-um-field">
              <label>นามสกุล</label>
              <input id="inv-lastname" class="swal-um-input" placeholder="นามสกุล" />
            </div>
          </div>
          <div class="swal-um-field">
            <label>อีเมล</label>
            <input id="inv-email" class="swal-um-input" type="email" placeholder="example@company.co.th" />
          </div>
          <div class="swal-um-row">
            <div class="swal-um-field">
              <label>แผนก</label>
              <select id="inv-dept" class="swal-um-select">
                <option value="">-- เลือกแผนก --</option>
                ${deptOptions}
                <option value="__new__">+ เพิ่มแผนกใหม่...</option>
              </select>
            </div>
            <div class="swal-um-field">
              <label>Role</label>
              <select id="inv-role" class="swal-um-select">${roleOptions}</select>
            </div>
          </div>
          <div class="swal-um-field" id="inv-new-dept-wrap" style="display:none">
            <label>ชื่อแผนกใหม่</label>
            <input id="inv-new-dept" class="swal-um-input" placeholder="ระบุชื่อแผนก" />
          </div>
        </div>
      `,
      didOpen: () => {
        // โชว์ input แผนกใหม่ถ้าเลือก "+ เพิ่มแผนกใหม่"
        const deptSelect = document.getElementById('inv-dept') as HTMLSelectElement;
        const newDeptWrap = document.getElementById('inv-new-dept-wrap') as HTMLElement;
        deptSelect.addEventListener('change', () => {
          newDeptWrap.style.display = deptSelect.value === '__new__' ? 'flex' : 'none';
        });
      },
      showCancelButton: true,
      confirmButtonText: 'เพิ่มผู้ใช้งาน',
      cancelButtonText: 'ยกเลิก',
      focusConfirm: false,
      preConfirm: () => {
        const firstName = (document.getElementById('inv-firstname') as HTMLInputElement).value.trim();
        const lastName  = (document.getElementById('inv-lastname')  as HTMLInputElement).value.trim();
        const email     = (document.getElementById('inv-email')     as HTMLInputElement).value.trim();
        const role      = (document.getElementById('inv-role')      as HTMLSelectElement).value;
        const deptSel   = (document.getElementById('inv-dept')      as HTMLSelectElement).value;
        const newDept   = (document.getElementById('inv-new-dept')  as HTMLInputElement).value.trim();

        if (!firstName || !lastName) {
          Swal.showValidationMessage('กรุณากรอกชื่อและนามสกุล');
          return false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('กรุณากรอกอีเมลให้ถูกต้อง');
          return false;
        }
        if (!deptSel) {
          Swal.showValidationMessage('กรุณาเลือกแผนก');
          return false;
        }
        if (deptSel === '__new__' && !newDept) {
          Swal.showValidationMessage('กรุณากรอกชื่อแผนกใหม่');
          return false;
        }

        const department = deptSel === '__new__' ? newDept : deptSel;
        const name = `${firstName} ${lastName}`;
        return { name, email, department, role };
      },
    });

    if (formValues) {
      // สร้าง id ถัดไปอัตโนมัติ
      const maxId = this.users.reduce((max, u) => {
        const n = parseInt(u.id.replace('USR-', ''), 10);
        return n > max ? n : max;
      }, 0);
      const newId = `USR-${String(maxId + 1).padStart(3, '0')}`;

      const newUser: User = {
        id:         newId,
        name:       formValues.name,
        email:      formValues.email,
        role:       formValues.role as User['role'],
        department: formValues.department,
        status:     'pending',        // ค่า default = pending รอ activate
        joinedDate: new Date(),
      };

      this.users.unshift(newUser);    // เพิ่มไว้บนสุด

      // อัปเดต department list ถ้ามีแผนกใหม่
      if (!this.availableDepartments.includes(formValues.department)) {
        this.availableDepartments = [...this.availableDepartments, formValues.department].sort();
      }

      this.applyFilters();
      this.notify(`เพิ่มผู้ใช้งาน ${formValues.name} (${newId}) สำเร็จ`);
    }
  }

  async bulkChangeRole(): Promise<void> {
    const roleOptions = this.availableRoles
      .map((r) => `<option value="${r.value}">${r.label}</option>`)
      .join('');

    const { value: role } = await Swal.fire({
      ...this.swalBase,
      title: 'เปลี่ยน Role',
      html: `
        <div class="swal-um-field" style="text-align:left">
          <label style="font-size:12px;color:#7d8590;font-weight:600">เลือก Role ใหม่</label>
          <select id="swal-bulk-role" class="swal-um-select">${roleOptions}</select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => (document.getElementById('swal-bulk-role') as HTMLSelectElement).value,
    });

    if (role) {
      this.users.forEach((u) => {
        if (this.selectedIds.has(u.id)) u.role = role as User['role'];
      });
      this.notify(`เปลี่ยน Role เป็น ${role} สำหรับ ${this.selectedIds.size} คน`);
      this.clearSelection();
      this.applyFilters();
    }
  }

  async bulkRemove(): Promise<void> {
    const count  = this.selectedIds.size;
    const result = await Swal.fire({
      ...this.swalBase,
      title: `ลบ ${count} รายการ?`,
      html: `<p style="color:#7d8590;margin:0">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#f85149',
      customClass: { ...this.swalBase.customClass, confirmButton: 'swal-um-confirm-danger' },
    });

    if (result.isConfirmed) {
      this.users = this.users.filter((u) => !this.selectedIds.has(u.id));
      this.notify(`ลบ ${count} รายการ เรียบร้อย`);
      this.clearSelection();
      this.applyFilters();
    }
  }

  // ── Display Helpers ───────────────────────────────────────────────────────

  getRoleLabel(role: string): string {
    return this.availableRoles.find((r) => r.value === role)?.label ?? role;
  }

  getRoleIcon(role: string): string {
    return this.roleIconMap[role] ?? 'person';
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarGradient(name: string): string {
    return this.avatarGradients[name.charCodeAt(0) % this.avatarGradients.length];
  }

  getRelativeTime(date: Date): string {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '—';
    }
  }

  private notify(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  }
}
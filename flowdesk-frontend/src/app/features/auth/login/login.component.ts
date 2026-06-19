// login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    document.body.style.overflow = 'hidden';
  }

login(): void {
  if (this.form.invalid) {
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });

    const errors = this.getValidationErrors();
    Swal.fire({
      icon: 'warning',
      title: 'ข้อมูลไม่ถูกต้อง',
      text: errors,
      confirmButtonText: 'OK',
      confirmButtonColor: '#f59e0b',
    });
    return;
  }

  // 🚀 เริ่มกระบวนการ Login
  this.isLoading = true;
  const { email, password } = this.form.value;
  console.log('🔄 [Login] เริ่มส่งข้อมูลเข้าระบบ:', { email: email.trim().toLowerCase() });

  this.authService
    .login({
      email: email.trim().toLowerCase(),
      password,
    })
    .subscribe({
      next: (res) => {
        // 🔒 ดักจับปัญหาจังหวะนรก: บังคับยัด Token ลงเครื่องแบบ Sync ทันทีในด่านแรก!
        if (res?.accessToken) {
          localStorage.setItem('accessToken', res.accessToken);
          console.log('✅ [Storage] ยืนยัน บันทึก accessToken ลงเครื่องสำเร็จ');
        }
        if (res?.refreshToken) {
          localStorage.setItem('refreshToken', res.refreshToken);
        }
        if (res?.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }

        this.isLoading = false;

        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          text: 'กำลังพาคุณไปยังหน้าหลัก...',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        }).then(() => {
          console.log('[Router] เริ่มต้นสั่งย้ายหน้าไปที่ /dashboard...');
    
          this.router.navigate(['/dashboard']).then(
            (success) => {
              console.log('[Router] ผลลัพธ์การย้ายหน้า Dashboard:', success);
              if (!success) {
                console.warn('[Router] ย้ายหน้าไม่สำเร็จ! ตัวเลขเป็น false ลองเช็ก authGuard หรือ Routing Path อีกรอบนะเพื่อน');
              }
            },
            (error) => {
              console.error('[Router] เกิด Error ระหว่างย้ายหน้า:', error);
            }
          );
        });
      },
      error: (error) => {
        console.error('[Login] เกิดข้อผิดพลาดจาก Backend:', error);
        this.isLoading = false;

        if (error.status === 403) {
          Swal.fire({
            icon: 'warning',
            title: 'ยังไม่ได้ยืนยันอีเมล',
            text: error?.error?.message || 'กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ',
            confirmButtonText: 'ไปยืนยันอีเมล',
            confirmButtonColor: '#f59e0b',
          }).then(() => {
            this.router.navigate(['/verify-otp'], {
              state: { email: this.form.value.email },
            });
          });
          return;
        }

        let errorMessage = 'ไม่สามารถเข้าสู่ระบบได้';
        if (error.status === 401) {
          errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        } else if (error.status === 0) {
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: errorMessage,
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
      },
    });
}

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  // ✅ ฟังก์ชันช่วยสร้างข้อความ error
  private getValidationErrors(): string {
    const errors: string[] = [];

    if (this.form.get('email')?.hasError('required')) {
      errors.push('กรุณากรอกอีเมล');
    } else if (this.form.get('email')?.hasError('email')) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    }

    if (this.form.get('password')?.hasError('required')) {
      errors.push('กรุณากรอกรหัสผ่าน');
    } else if (this.form.get('password')?.hasError('minlength')) {
      errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    }

    return errors.join('\n');
  }
}

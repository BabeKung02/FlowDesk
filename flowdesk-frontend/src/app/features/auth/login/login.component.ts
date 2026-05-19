// login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2'; // ✅ เพิ่ม SweetAlert2

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
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    document.body.style.overflow = 'hidden';
  }

  login(): void {
    // ✅ ตรวจสอบ Form ก่อน
    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAsTouched();
      });

      // ✅ แสดงข้อความแจ้งเตือนเมื่อกรอกข้อมูลไม่ครบ
      const errors = this.getValidationErrors();
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: errors,
        confirmButtonText: 'ตรวจสอบอีกครั้ง',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    // ✅ ถ้า Form ถูกต้อง ให้ทำการ Login
    this.isLoading = true;
    const { email, password } = this.form.value;
    console.log('Login attempt:', { email, password });

    this.authService
      .login({
        email: email.trim().toLowerCase(),
        password,
      })
      .subscribe({
        next: (token) => {
          console.log('Token saved:', token);
          this.isLoading = false;

          // ✅ แสดงข้อความเข้าสู่ระบบสำเร็จ
          Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ!',
            text: 'กำลังพาคุณไปยังหน้าหลัก...',
            timer: 1500,
            showConfirmButton: false,
            timerProgressBar: true,
          }).then(() => {
            // Navigate to dashboard หลังจากแสดง SweetAlert
            this.router.navigate(['/dashboard']).then(
              (success) => console.log('Navigation success:', success),
              (error) => console.error('Navigation error:', error),
            );
          });
        },
        error: (error) => {
          console.error('Login error:', error);
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

          // กรณีต่างๆ ของ error
          if (error.status === 401) {
            errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
          } else if (error.status === 0) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }

          Swal.fire({
            icon: 'error',
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            text: errorMessage,
            confirmButtonText: 'ลองอีกครั้ง',
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

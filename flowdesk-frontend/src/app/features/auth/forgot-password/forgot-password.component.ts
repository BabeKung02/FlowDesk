import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { AuthService } from '../../../core/services/auth.service';

type Step = 'email' | 'otp' | 'password';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // ── State ──────────────────────────────────────────
  currentStep: Step = 'email';
  isLoading = false;
  errorMessage = '';
  email = '';

  // ── Forms ──────────────────────────────────────────
  emailForm!: FormGroup;
  otpForm!: FormGroup;
  passwordForm!: FormGroup;

  // ── Password visibility ────────────────────────────
  hidePassword = true;
  hideConfirmPassword = true;

  // ── Countdown ──────────────────────────────────────
  countdown = 0;
  countdownDisplay = '';
  private timer: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private initForms(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.otpForm = this.fb.group({
      otp: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern('^[0-9]*$'),
        ],
      ],
    });

    this.passwordForm = this.fb.group(
      {
        newPassword: [
          '',
          [Validators.required, Validators.minLength(8), this.passwordStrengthValidator],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  private passwordStrengthValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const valid =
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[!@#$%^&*_]/.test(value);
    return valid ? null : { weakPassword: true };
  };

  private passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('newPassword');
    const confirm = control.get('confirmPassword');
    if (!password || !confirm) return null;
    if (password.value !== confirm.value) {
      confirm.setErrors({ ...(confirm.errors || {}), passwordMismatch: true });
    } else {
      if (confirm.errors) {
        delete confirm.errors['passwordMismatch'];
        if (!Object.keys(confirm.errors).length) confirm.setErrors(null);
      }
    }
    return null;
  };

  // ── Step 1: ส่ง OTP ───────────────────────────────
  onSubmitEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.email = this.emailForm.value.email.trim().toLowerCase();

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 'otp';
        this.loadOTPStatus();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      },
    });
  }

  // ── Step 2: ยืนยัน OTP ───────────────────────────
  onSubmitOTP(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ✅ verify OTP จริงกับ Backend
    this.authService
      .verifyForgotOTP({
        email: this.email,
        otp: this.otpForm.value.otp,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep = 'password'; // ← ผ่านมา Step 3
          clearInterval(this.timer);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'รหัส OTP ไม่ถูกต้อง';
        },
      });
  }

  // ── Step 3: เปลี่ยนรหัสผ่าน ──────────────────────
  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { newPassword } = this.passwordForm.value;
    const otp = this.otpForm.value.otp;

    // ✅ ส่ง email + otp + newPassword ไป Backend
    // Backend จะ verify OTP อีกครั้งแล้ว UPDATE password ใน DB
    this.authService
      .resetPassword({
        email: this.email,
        otp,
        newPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/login'], {
            state: { passwordReset: true },
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        },
      });
  }

  // ── OTP Status ────────────────────────────────────
  private loadOTPStatus(): void {
    this.authService.getOTPStatus(this.email).subscribe({
      next: (res) => {
        this.countdown = res.remainingSeconds;
        this.updateDisplay();
        if (!res.isExpired) this.startCountdown();
        else this.errorMessage = 'รหัส OTP หมดอายุแล้ว\nกรุณาขอรหัสใหม่';
      },
      error: () => {
        this.countdown = 600;
        this.startCountdown();
      },
    });
  }

  private startCountdown(): void {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown--;
      this.updateDisplay();
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.errorMessage = 'รหัส OTP หมดอายุแล้ว\nกรุณาขอรหัสใหม่';
      }
    }, 1000);
  }

  private updateDisplay(): void {
    const m = Math.floor(this.countdown / 60);
    const s = this.countdown % 60;
    this.countdownDisplay = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  resendOTP(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resendOTP(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.otpForm.reset();
        this.loadOTPStatus();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'ไม่สามารถส่ง OTP ใหม่ได้';
      },
    });
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  // ── Helper ────────────────────────────────────────
  get stepNumber(): number {
    return { email: 1, otp: 2, password: 3 }[this.currentStep];
  }
}

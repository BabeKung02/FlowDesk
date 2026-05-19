import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { AuthService, ResendOTPResponse } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'],
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  otpForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  email = '';
  otpExpires: Date | null = null; // ← ประกาศ type ถูกต้อง

  countdown = 0;
  countdownDisplay = '';
  private timer: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    const nav = this.router.getCurrentNavigation();
    this.email = nav?.extras?.state?.['email'] ?? '';
    this.otpExpires = nav?.extras?.state?.['otpExpires']
      ? new Date(nav.extras.state['otpExpires'])
      : null;
  }

  ngOnInit(): void {
    if (!this.email) {
      this.router.navigate(['/register']);
      return;
    }
    this.initForm();
    this.loadOTPStatus();
    // this.startCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private initForm(): void {
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
  }

  private loadOTPStatus(): void {
    this.authService.getOTPStatus(this.email).subscribe({
      next: (res) => {
        this.countdown = res.remainingSeconds;
        this.updateDisplay();

        if (res.isExpired) {
          this.errorMessage = 'รหัส OTP หมดอายุแล้ว\nกรุณาขอรหัสใหม่';
          return;
        }

        this.startCountdown();
      },
      error: () => {
        // ถ้า API ล้มเหลว fallback เป็น 0 (หมดอายุ)
        this.countdown = 0;
        this.updateDisplay();
        this.errorMessage = 'ไม่สามารถตรวจสอบสถานะ OTP ได้';
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
        this.errorMessage = 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่';
      }
    }, 1000);
  }
  private updateDisplay(): void {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    this.countdownDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { otp } = this.otpForm.value;

    this.authService.verifyEmail({ email: this.email, otp }).subscribe({
      next: () => {
        this.isLoading = false;
        clearInterval(this.timer);
        this.router.navigate(['/login'], {
          state: { verified: true },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.status === 400
            ? 'รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว'
            : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      },
    });
  }

  resendOTP(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resendOTP(this.email).subscribe({
      next: (res: ResendOTPResponse) => {
        this.isLoading = false;
        clearInterval(this.timer);
        this.otpExpires = res.otpExpires ? new Date(res.otpExpires) : null;
        this.otpForm.reset();
        this.loadOTPStatus();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'ไม่สามารถส่ง OTP ใหม่ได้ กรุณาลองใหม่';
      },
    });
  }
}

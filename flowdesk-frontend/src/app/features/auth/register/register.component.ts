import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  isSuccess = false;
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    document.body.style.overflow = 'hidden';
  }

  private initForm(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(128),
            this.passwordStrengthValidator,
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // ── Password Strength ─────────────────────────────
private passwordStrengthValidator = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;

  const hasUpper   = /[A-Z]/.test(value);
  const hasLower   = /[a-z]/.test(value);
  const hasNumber  = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*-_]/.test(value);

  const valid = hasUpper && hasLower && hasNumber && hasSpecial;
  return valid ? null : { weakPassword: true };
};

  // ── Password Match ────────────────────────────────
  private passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
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

  // ── Submit ────────────────────────────────────────
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    
    this.errorMessage = '';

    const { firstName, lastName, email, password } = this.registerForm.value;

    this.authService
      .register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.router.navigate(['/verify-otp'], {
            state: { email, otpExpires: res.otpExpires },
          });
        },
        error: (error) => {
          this.isLoading = false;

          this.errorMessage =
            error?.status === 409
              ? 'This email is already registered.'
              : error?.error?.message || 'An unexpected error occurred.';
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
  };
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  otpExpires: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface ResendOTPResponse {
  success: boolean;
  message: string;
  otpExpires: string;
}

export interface OTPStatusResponse {
  remainingSeconds: number;
  isExpired: boolean;
}

export interface VerifyForgotOTPResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  constructor(private http: HttpClient) {}

  // ── Auth API ──────────────────────────────────────

  register(data: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  verifyEmail(data: { email: string; otp: string }): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${this.apiUrl}/verify-email`, data);
  }

  login(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(tap((res) => this.storeAuth(res)));
  }

  forgotPassword(data: { email: string }): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, data);
  }

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.apiUrl}/change-password`, data);
  }

  resendOTP(email: string): Observable<ResendOTPResponse> {
    return this.http.post<ResendOTPResponse>(`${this.apiUrl}/resend-otp`, { email });
  }

  getOTPStatus(email: string): Observable<OTPStatusResponse> {
    return this.http.get<OTPStatusResponse>(`${this.apiUrl}/otp-status`, { params: { email } });
  }

  verifyForgotOTP(data: { email: string; otp: string }): Observable<VerifyForgotOTPResponse> {
    return this.http.post<VerifyForgotOTPResponse>(`${this.apiUrl}/verify-forgot-otp`, data);
  }
  
  // ── Token Refresh & Logout ─────────────────────────

  refreshAccessToken(): Observable<{ success: boolean; accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<{ success: boolean; accessToken: string }>(
        `${this.apiUrl}/refresh-token`,
        { refreshToken }
      )
      .pipe(tap((res) => localStorage.setItem(this.TOKEN_KEY, res.accessToken)));
  }

  logoutFromServer(): Observable<{ success: boolean; message: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/logout`,
      { refreshToken }  // ส่ง token ของเครื่องนี้ไปด้วย เพื่อ revoke เฉพาะ device นี้
    );
  }

  logoutAllDevices(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/logout-all`,
      {}
    );
  }

  // ── Storage Management ────────────────────────────

  private storeAuth(res: AuthResponse): void {
    if (res?.accessToken) {
      localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    }

    if (res?.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    }

    if (res?.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    }
  }

  getUser(): AuthUser | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

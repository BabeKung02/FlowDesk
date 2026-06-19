import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationHistory {
  id: string;
  userId: string;
  requestId: string;
  type: string;       // "APPROVED" | "REJECTED"
  message: string;
  channel: string;     // "EMAIL"
  status: string;      // "SENT" | "FAILED"
  sentAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationHistory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NotificationQuery {
  status?: 'SENT' | 'FAILED';
  userId?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  // USER เห็นแค่ของตัวเอง / ADMIN-MANAGER เห็นทั้งหมด หรือ filter ด้วย userId
  getAll(query: NotificationQuery = {}): Observable<NotificationListResponse> {
    const params: Record<string, string> = {};
    if (query.status) params['status'] = query.status;
    if (query.userId) params['userId'] = query.userId;
    if (query.page) params['page'] = String(query.page);
    if (query.limit) params['limit'] = String(query.limit);

    return this.http.get<NotificationListResponse>(this.apiUrl, { params });
  }
}

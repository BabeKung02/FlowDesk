import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  recipientCount: number;
  createdAt: string;
  creator: { firstName: string; lastName: string };
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
}

export interface CreateAnnouncementResponse {
  success: boolean;
  data: {
    announcement: Announcement;
    totalRecipients: number;
    published: number;
  };
}

export interface AnnouncementListResponse {
  success: boolean;
  data: Announcement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly apiUrl = `${environment.apiUrl}/announcements`;

  constructor(private http: HttpClient) {}

  // ส่งประกาศ — backend จะ broadcast ให้ user ทุกคนที่ verified ผ่าน RabbitMQ
  create(payload: CreateAnnouncementPayload): Observable<CreateAnnouncementResponse> {
    return this.http.post<CreateAnnouncementResponse>(this.apiUrl, payload);
  }

  getAll(page = 1, limit = 10): Observable<AnnouncementListResponse> {
    return this.http.get<AnnouncementListResponse>(this.apiUrl, {
      params: { page: String(page), limit: String(limit) },
    });
  }
}

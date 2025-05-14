// src/models/Notification.ts
export interface Notification {
  id?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  status: 'pending' | 'sent' | 'failed';

  recipientUid: string;
  channel: 'email' | 'sms' | 'push';
  type: string;
  payload: Record<string, any>;
  scheduledAt: Date;
  sentAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}
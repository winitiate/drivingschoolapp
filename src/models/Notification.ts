// src/models/Notification.ts

import { BaseEntity } from './BaseEntity';

export interface Notification extends BaseEntity {
  recipientUid: string;
  channel: 'email' | 'sms' | 'push';
  type: string;
  payload: Record<string, any>;

  scheduledAt: Date;
  sentAt?: Date;
  readAt?: Date;
  errorMessage?: string;

  customFields?: Record<string, any>;
}

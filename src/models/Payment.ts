// src/models/Payment.ts
import { BaseEntity } from './BaseEntity';

export interface Payment extends BaseEntity {
  appointmentId: string;
  studentId: string;

  amount: number;
  currency: string;
  tenderType: string;

  transactionId: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  receiptUrl: string;
  processedAt: Date;

  // Optional fields you asked for
  fees?: number;
  netTotal?: number;
  tenderNote?: string;
  cardBrand?: string;
  panSuffix?: string;
  detailsUrl?: string;
}
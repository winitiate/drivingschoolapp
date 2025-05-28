// src/models/Availability.ts
import { BaseEntity } from './BaseEntity';

export interface DailySlot {
  start: string; // “HH:mm”
  end:   string; // “HH:mm”
}

export interface DailySchedule {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  slots:   DailySlot[];
}

export type AvailabilityScope = 'business' | 'location' | 'provider';

export interface Availability extends BaseEntity {
  scope:         AvailabilityScope;
  scopeId:       string;
  weekly:        DailySchedule[];
  blocked:       string[];      // “YYYY-MM-DD_YYYY-MM-DD” or with times
  maxPerDay?:    number;        // you already had this
  maxConcurrent?: number;       // NEW: how many clients at once
}

// src/models/FAQ.ts
import { BaseEntity } from './BaseEntity';

export interface FAQ extends BaseEntity {
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
}
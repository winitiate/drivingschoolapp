// src/models/LessonType.ts
import { BaseEntity } from './BaseEntity';

export interface LessonType extends BaseEntity {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  practiceTimeMinutes: number;
  prerequisiteLessonTypeIds: string[];
  schoolId: string;
  maxStudents: number;
}
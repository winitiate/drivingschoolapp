// src/data/LessonTypeStore.ts
import { LessonType } from "../models/LessonType";

export interface LessonTypeStore {
  getById(id: string): Promise<LessonType | null>;
  listAll(): Promise<LessonType[]>;
  listBySchool(schoolId: string): Promise<LessonType[]>;
  save(lessonType: LessonType): Promise<void>;
}
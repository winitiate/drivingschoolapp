// src/models/Package.ts
export interface Package {
  id?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  status: string;

  name: string;
  description: string;
  price: number;
  lessonTypeIds: string[];
  lessonCount: number;
  expiryDate: Date;
  studentAssignments: string[];
}

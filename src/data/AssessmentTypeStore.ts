// src\data\AssessmentTypeStore.ts
import { AssessmentType } from "../models/AssessmentType";

export interface AssessmentTypeStore {
  listByServiceLocation(serviceLocationId: string): Promise<AssessmentType[]>;
  save(assessmentType: AssessmentType): Promise<void>;
}

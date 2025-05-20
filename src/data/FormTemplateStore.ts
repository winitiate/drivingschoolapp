// src/data/FormTemplateStore.ts

import { FormTemplate } from '../models/FormTemplate';

export interface FormTemplateStore {
  /** Grab a single template by its Firestore ID */
  getById(id: string): Promise<FormTemplate | null>;

  /** List templates by ownerType and (optionally) ownerId */
  listByOwner(ownerType: FormTemplate['ownerType'], ownerId?: string): Promise<FormTemplate[]>;

  /** Create or overwrite a template */
  save(template: FormTemplate): Promise<void>;

  /** Delete a template */
  delete(id: string): Promise<void>;
}

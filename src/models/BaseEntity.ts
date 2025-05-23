// src/models/BaseEntity.ts

export interface BaseEntity {
  /** Auto-generated by Firestore; undefined when creating new */
  id?: string;

  /** When the document was created */
  createdAt: Date;
  /** When the document was last updated */
  updatedAt: Date;

  /** UID of the user who created this record */
  createdBy: string;
  /** UID of the user who last modified this record */
  updatedBy: string;

  /** e.g. "active" | "archived" | "cancelled" */
  status: 'active' | 'archived' | 'cancelled';
}

// src/data/FirestoreAppointmentStore.ts
import { Appointment } from '../models/Appointment';
import { AppointmentStore } from './AppointmentStore';
import { auth } from '../firebase'; // for token
import { Appointment as AppointmentType } from '../models/Appointment';

/**
 * Uses the Firestore REST API for listByStudent to bypass SDK streaming.
 */
export class FirestoreAppointmentStore implements AppointmentStore {
  private projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID!;
  private baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents:runQuery`;

  async getById(id: string): Promise<AppointmentType | null> {
    // you can keep your existing SDK-based implementation if desired
    throw new Error('getById not implemented via REST');
  }

  async listAll(): Promise<AppointmentType[]> {
    // you can keep your existing SDK-based implementation if desired
    throw new Error('listAll not implemented via REST');
  }

  /**
   * Fetch only upcoming appointments for a student via REST API.
   */
  async listByStudent(studentId: string): Promise<AppointmentType[]> {
    if (!studentId) throw new Error('listByStudent called without a studentId');

    const now = new Date().toISOString();
    const structuredQuery = {
      from: [{ collectionId: 'appointments' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'studentId' },
                op: 'EQUAL',
                value: { stringValue: studentId }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'startTime' },
                op: 'GREATER_THAN_OR_EQUAL',
                value: { timestampValue: now }
              }
            }
          ]
        }
      },
      orderBy: [{ field: { fieldPath: 'startTime' }, direction: 'ASCENDING' }],
      limit: 20
    };

    const token = await auth.currentUser!.getIdToken();
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ structuredQuery })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Firestore REST error:', errText);
      throw new Error(`Firestore REST failed: ${res.status}`);
    }

    const lines = await res.json();
    return lines
      .filter((r: any) => r.document)
      .map((r: any) => {
        const doc = r.document;
        const fields = doc.fields || {};
        // convert fieldValue objects to native JS values
        const data: any = {};
        for (const [key, val] of Object.entries(fields)) {
          if ('stringValue' in val) data[key] = val.stringValue;
          else if ('integerValue' in val) data[key] = Number(val.integerValue);
          else if ('timestampValue' in val) data[key] = new Date(val.timestampValue);
          else data[key] = val;
        }
        return { id: doc.name.split('/').pop()!, ...(data as AppointmentType) };
      });
  }

  async listByInstructor(instructorId: string): Promise<AppointmentType[]> {
    // similar REST-based implementation if needed, or fall back to SDK
    return [];
  }

  async save(appointment: AppointmentType): Promise<void> {
    // keep your existing SDK-based save or implement via REST
    throw new Error('save not implemented via REST');
  }
}

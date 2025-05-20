import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp
} from "firebase/firestore";
import { AssessmentType } from "../models/AssessmentType";
import { AssessmentTypeStore } from "./AssessmentTypeStore";

const COLL = "assessmentTypes";

export class FirestoreAssessmentTypeStore implements AssessmentTypeStore {
  private db = getFirestore();
  private coll = collection(this.db, COLL);

  async listByServiceLocation(serviceLocationId: string): Promise<AssessmentType[]> {
    const q = query(this.coll, where("serviceLocationId", "==", serviceLocationId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as AssessmentType) }));
  }

  async save(assessmentType: AssessmentType): Promise<void> {
    const now = Timestamp.now();
    const ref = assessmentType.id
      ? doc(this.db, COLL, assessmentType.id)
      : doc(this.coll);
    await setDoc(
      ref,
      {
        ...assessmentType,
        createdAt: assessmentType.createdAt || now,
        updatedAt: now
      },
      { merge: true }
    );
  }
}

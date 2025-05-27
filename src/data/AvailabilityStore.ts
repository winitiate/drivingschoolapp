// Defines the abstraction for Availability
import { Availability, AvailabilityScope } from "../models/Availability";

export interface AvailabilityStore {
  /** Fetch the one record for this scope+scopeId (or null) */
  getByScope(
    scope: AvailabilityScope,
    scopeId: string
  ): Promise<Availability | null>;

  /** Fetch every availability document in the system */
  listAll(): Promise<Availability[]>;

  /** Create or update */
  save(av: Availability): Promise<void>;
}

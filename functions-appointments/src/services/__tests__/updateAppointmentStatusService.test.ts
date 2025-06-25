import * as admin from "firebase-admin";
import {
  updateAppointmentStatusService,
} from "../updateAppointmentStatusService";
import { UpdateAppointmentStatusInput } from "../../types/appointment";

const mockUpdate = jest.fn();
jest.mock("firebase-admin", () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: () => ({
    collection: () => ({
      doc: () => ({ update: mockUpdate }),
    }),
  }),
}));

describe("updateAppointmentStatusService", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
  });

  it("patches status and metadata", async () => {
    const input: UpdateAppointmentStatusInput = {
      appointmentId: "a2",
      status:        "cancelled",
      metadata:      { reason: "test" },
    };
    const res = await updateAppointmentStatusService(input);
    expect(mockUpdate).toHaveBeenCalledWith({
      status:     "cancelled",
      reason:     "test",
    });
    expect(res).toEqual({ success: true });
  });
});

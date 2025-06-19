import * as admin from "firebase-admin";
import { createAppointmentService } from "../createAppointmentService";
import { CreateAppointmentInput } from "../../types/appointment";

// Mock admin.firestore()
const mockSet = jest.fn();
jest.mock("firebase-admin", () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: () => ({
    collection: () => ({
      doc: () => ({ set: mockSet }),
    }),
  }),
}));

describe("createAppointmentService", () => {
  beforeEach(() => {
    mockSet.mockClear();
  });

  it("writes the appointment doc", async () => {
    const input: CreateAppointmentInput = {
      appointmentId: "a1",
      appointmentData: { foo: "bar" },
    };
    const res = await createAppointmentService(input);
    expect(mockSet).toHaveBeenCalledWith({ foo: "bar" });
    expect(res).toEqual({ success: true });
  });
});

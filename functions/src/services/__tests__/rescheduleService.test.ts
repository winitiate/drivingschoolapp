import { rescheduleAppointmentService } from "../rescheduleService";
import { HttpsError } from "firebase-functions/v2/https";

// mock Firestore
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
}));
import { getFirestore } from "firebase-admin/firestore";

describe("rescheduleAppointmentService", () => {
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCol: jest.Mock;

  beforeEach(() => {
    mockGet     = jest.fn();
    mockSet     = jest.fn();
    mockUpdate  = jest.fn();

    // seq: oldDoc, newDoc, paymentDoc
    mockDoc = jest.fn()
      .mockReturnValueOnce({ get: mockGet })
      .mockReturnValueOnce({ set: mockSet })
      .mockReturnValueOnce({ update: mockUpdate });

    mockCol = jest.fn().mockReturnValue({ doc: mockDoc });
    (getFirestore as jest.Mock).mockReturnValue({
      collection: mockCol,
    });
  });

  afterEach(() => jest.resetAllMocks());

  it("throws INVALID_ARGUMENT if arguments are missing", async () => {
    await expect(
      rescheduleAppointmentService({
        oldAppointmentId:    "",
        newAppointmentData: { id: "" },
      })
    ).rejects.toThrow(HttpsError);
  });

  it("throws NOT_FOUND if the original appointment does not exist", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    await expect(
      rescheduleAppointmentService({
        oldAppointmentId:    "old123",
        newAppointmentData: { id: "new456" },
      })
    ).rejects.toThrow(/Original appointment "old123" not found/);
  });

  it("reschedules successfully when no paymentId is present", async () => {
    mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ /* no paymentId */ }) });

    const input = {
      oldAppointmentId:    "old123",
      newAppointmentData: { id: "new456", foo: "bar" },
    };
    const res = await rescheduleAppointmentService(input);

    expect(mockCol).toHaveBeenCalledWith("appointments");
    expect(mockDoc).toHaveBeenNthCalledWith(1, "old123");
    expect(mockDoc).toHaveBeenNthCalledWith(2, "new456");
    expect(mockSet).toHaveBeenCalledWith({
      id:      "new456",
      foo:     "bar",
      status:  "scheduled",
    });

    // old appointment marked rescheduled
    expect(mockUpdate).toHaveBeenCalledWith({
      status:        "rescheduled",
      rescheduledTo: "new456",
      rescheduledAt: expect.any(Date),
    });

    // no payment doc touched
    expect(mockDoc).toHaveBeenCalledTimes(2);

    expect(res).toEqual({ success: true, newAppointmentId: "new456" });
  });

  it("reschedules & re-links payment when paymentId is present", async () => {
    mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ paymentId: "pay789" }) });

    const input = {
      oldAppointmentId:    "old123",
      newAppointmentData: { id: "new456", foo: "bar" },
    };
    const res = await rescheduleAppointmentService(input);

    // doc(): old, new, payment
    expect(mockDoc).toHaveBeenCalledTimes(3);
    expect(mockDoc).toHaveBeenNthCalledWith(3, "pay789");
    expect(mockUpdate).toHaveBeenCalledWith({ appointmentId: "new456" });

    expect(res).toEqual({ success: true, newAppointmentId: "new456" });
  });
});

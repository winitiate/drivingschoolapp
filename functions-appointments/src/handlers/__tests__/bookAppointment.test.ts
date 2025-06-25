/**
 * bookAppointment.test.ts
 *
 * Unit tests for the pure bookAppointmentHandler function.
 * Mocks out paymentService.charge and createAppointmentService.
 */

jest.mock("../../services/paymentService");
jest.mock("../../services/createAppointmentService");

import { bookAppointmentHandler } from "../bookAppointment";
import { HttpsError }            from "firebase-functions/v2/https";
import * as paymentSvc           from "../../services/paymentService";
import * as apptSvc              from "../../services/createAppointmentService";

// Silence console.error in tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

// Helper to fake a CallableRequest
function makeReq(data: any) {
  return { data } as any;
}

describe("bookAppointmentHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("charges and creates appointment on valid input", async () => {
    (paymentSvc.charge as jest.Mock).mockResolvedValue({
      paymentId: "pay123",
      status:    "COMPLETED",
    });
    (apptSvc.createAppointmentService as jest.Mock).mockResolvedValue(undefined);

    const req = makeReq({
      appointmentData: { appointmentId: "A1" },
      toBeUsedBy:      "loc1",
      amountCents:     1000,
      nonce:           "nonce1",
    });

    const res = await bookAppointmentHandler(req);

    expect(paymentSvc.charge).toHaveBeenCalledWith(expect.objectContaining({
      toBeUsedBy:  "loc1",
      amountCents: 1000,
      nonce:       "nonce1",
    }));
    expect(apptSvc.createAppointmentService).toHaveBeenCalledWith({
      appointmentId: "A1",
      appointmentData: { appointmentId: "A1", paymentId: "pay123" },
    });
    expect(res).toEqual({
      success:       true,
      appointmentId: "A1",
      paymentId:     "pay123",
    });
  });

  it("throws invalid-argument if required fields are missing", async () => {
    const req = makeReq({ foo: "bar" });
    await expect(bookAppointmentHandler(req)).rejects.toThrow(HttpsError);
  });

  it("throws when paymentService.charge rejects", async () => {
    // Now we expect the handler to surface the original error message
    (paymentSvc.charge as jest.Mock).mockRejectedValue(new Error("card declined"));

    const req = makeReq({
      appointmentData: { appointmentId: "A2" },
      toBeUsedBy:      "loc1",
      amountCents:     1000,
      nonce:           "nonce2",
    });

    await expect(bookAppointmentHandler(req)).rejects.toThrow("card declined");
  });

  it("throws when appointment creation fails", async () => {
    (paymentSvc.charge as jest.Mock).mockResolvedValue({
      paymentId: "pay456",
      status:    "COMPLETED",
    });
    (apptSvc.createAppointmentService as jest.Mock).mockRejectedValue(new Error("db error"));

    const req = makeReq({
      appointmentData: { appointmentId: "A3" },
      toBeUsedBy:      "loc1",
      amountCents:     2000,
      nonce:           "nonce3",
    });

    await expect(bookAppointmentHandler(req)).rejects.toThrow(
      "Appointment creation failed after payment"
    );
  });
});

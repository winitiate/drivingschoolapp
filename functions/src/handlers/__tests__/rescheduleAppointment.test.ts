import { HttpsError } from "firebase-functions/v2/https";
import { rescheduleAppointment } from "../rescheduleAppointment";
import { rescheduleAppointmentService } from "../../services/rescheduleService";

jest.mock("../../services/rescheduleService");

describe("rescheduleAppointment handler", () => {
  const handler = (rescheduleAppointment as any)[1] as CallableFunction;
  const makeReq = (data: any) => ({ data } as any);

  afterEach(() => jest.resetAllMocks());

  it("invokes service and returns its result on valid input", async () => {
    (rescheduleAppointmentService as jest.Mock).mockResolvedValue({
      success: true,
      newAppointmentId: "new123",
    });

    const payload = {
      oldAppointmentId:   "old123",
      newAppointmentData: { id: "new123" },
    };
    const result = await handler(makeReq(payload));

    expect(rescheduleAppointmentService).toHaveBeenCalledWith(payload);
    expect(result).toEqual({
      success: true,
      newAppointmentId: "new123",
    });
  });

  it("throws INVALID_ARGUMENT when service throws HttpsError('invalid-argument')", async () => {
    (rescheduleAppointmentService as jest.Mock).mockImplementation(() => {
      throw new HttpsError("invalid-argument", "Bad input");
    });

    await expect(handler(makeReq({ foo: "bar" }))).rejects.toThrow(HttpsError);
  });

  it("wraps unknown errors as INTERNAL", async () => {
    (rescheduleAppointmentService as jest.Mock).mockImplementation(() => {
      throw new Error("Oops");
    });

    await expect(
      handler(
        makeReq({
          oldAppointmentId:   "old123",
          newAppointmentData: { id: "new123" },
        })
      )
    ).rejects.toThrow(/Reschedule failed/);
  });
});

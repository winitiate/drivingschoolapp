import { refund } from "../refundService";
import { PaymentCredentialStore } from "../../stores/paymentCredentialStore";
import { getSquareClient } from "../../clients/squareClient";

jest.mock("../../clients/squareClient", () => ({
  getSquareClient: jest.fn(),
}));
jest.mock("../../stores/paymentCredentialStore", () => ({
  PaymentCredentialStore: jest.fn().mockImplementation(() => ({
    getByConsumer: jest.fn(),
  })),
}));

describe("refundService.refund", () => {
  const fakeCred = {
    credentials: {
      applicationId: "prod-abc",
      accessToken:   "tok2",
    },
  };

  it("throws if no credential found", async () => {
    (PaymentCredentialStore as jest.Mock).mockImplementation(() => ({
      getByConsumer: jest.fn().mockResolvedValue(null),
    }));
    await expect(
      refund({ toBeUsedBy: "u1", paymentId: "p", amountCents: 500, idempotencyKey: "r1" })
    ).rejects.toThrow("No Square credentials");
  });

  it("calls Square refund and returns refundId/status", async () => {
    (PaymentCredentialStore as jest.Mock).mockImplementation(() => ({
      getByConsumer: jest.fn().mockResolvedValue(fakeCred),
    }));
    const fakeRefund = jest.fn().mockResolvedValue({
      result: { refund: { id: "ref123", status: "PENDING" } },
    });
    (getSquareClient as jest.Mock).mockReturnValue({
      paymentsApi: { refundPayment: fakeRefund },
    });

    const res = await refund({
      toBeUsedBy:     "u2",
      paymentId:      "p2",
      amountCents:    500,
      idempotencyKey: "r2",
    });

    expect(fakeRefund).toHaveBeenCalledWith({
      idempotencyKey: "r2",
      paymentId:      "p2",
      amountMoney:    { amount: BigInt(500), currency: "USD" },
    });
    expect(res).toEqual({ refundId: "ref123", status: "PENDING" });
  });
});

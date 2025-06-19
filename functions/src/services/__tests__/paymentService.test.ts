import { charge } from "../paymentService";
import { PaymentCredentialStore } from "../../stores/paymentCredentialStore";
import { getSquareClient } from "../../clients/squareClient";

// 1) Mock out getSquareClient to return a fake paymentsApi
jest.mock("../../clients/squareClient", () => ({
  getSquareClient: jest.fn(),
}));

// 2) Mock out the credential store
jest.mock("../../stores/paymentCredentialStore", () => ({
  PaymentCredentialStore: jest.fn().mockImplementation(() => ({
    getByConsumer: jest.fn(),
  })),
}));

describe("paymentService.charge", () => {
  const fakeCred = {
    credentials: {
      applicationId: "sandbox-123",
      accessToken:   "tok",
    },
  };
  beforeEach(() => {
    // Reset mocks
    (PaymentCredentialStore as jest.Mock).mockClear();
    (getSquareClient as jest.Mock).mockClear();
  });

  it("throws if no credential found", async () => {
    // getByConsumer returns null
    (PaymentCredentialStore as jest.Mock).mockImplementation(() => ({
      getByConsumer: jest.fn().mockResolvedValue(null),
    }));

    await expect(
      charge({ toBeUsedBy: "u1", nonce: "n", amountCents: 100, idempotencyKey: "k" })
    ).rejects.toThrow("No Square credentials");
  });

  it("calls Square and returns paymentId/status", async () => {
    // getByConsumer returns our fakeCred
    (PaymentCredentialStore as jest.Mock).mockImplementation(() => ({
      getByConsumer: jest.fn().mockResolvedValue(fakeCred),
    }));
    // Fake paymentsApi
    const fakeCreate = jest.fn().mockResolvedValue({
      result: { payment: { id: "pay123", status: "COMPLETED" } },
    });
    (getSquareClient as jest.Mock).mockReturnValue({
      paymentsApi: { createPayment: fakeCreate },
    });

    const res = await charge({
      toBeUsedBy:     "u1",
      nonce:          "n",
      amountCents:    2500,
      idempotencyKey: "ik",
    });

    expect(fakeCreate).toHaveBeenCalledWith({
      sourceId:       "n",
      idempotencyKey: "ik",
      amountMoney:    { amount: BigInt(2500), currency: "CAD" },
    });
    expect(res).toEqual({ paymentId: "pay123", status: "COMPLETED" });
  });
});

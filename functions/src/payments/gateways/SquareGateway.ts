// functions/src/payments/gateways/SquareGateway.ts
import { Client, Environment } from "square/legacy";
import { v4 as uuidv4 } from "uuid";
import { decrypt } from "../../utils/encryption";
import { getFirestore } from "firebase-admin/firestore";
import {
  PaymentGateway,
  CreatePaymentInput,
  RefundPaymentInput,
} from "./PaymentGateway";

export class SquareGateway implements PaymentGateway {
  /* ───────── credential helper ───────── */
  private async getCredential(ownerType: string, ownerId: string) {
    const snap = await getFirestore()
      .collection("paymentCredentials")
      .where("provider", "==", "square")
      .where("ownerType", "==", ownerType)
      .where("ownerId", "==", ownerId)
      .limit(1)
      .get();

    if (snap.empty) throw new Error("Square credential not found");

    const data = snap.docs[0].data();
    const accessToken = decrypt(data.credentials.accessToken);

    console.log("🔓 Square token prefix:", accessToken.slice(0, 10) + "…");

    return {
      accessToken,
      locationId: data.credentials.locationId as string,
    };
  }

  /* ───────── charge a card ───────── */
  async createPayment(input: CreatePaymentInput) {
    const creds = await this.getCredential(input.ownerType, input.ownerId);

    const client = new Client({
      accessToken: creds.accessToken,
      environment: Environment.Sandbox,
      squareVersion: "2025-05-21",
    });

    // Compat with SDK ≥17 (`paymentsApi`) and legacy (`payments`)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const paymentsApi = client.paymentsApi ?? client.payments;
    if (!paymentsApi?.createPayment) {
      throw new Error("Square SDK payments API not available on client");
    }

    const body = {
      idempotencyKey: input.idempotencyKey,
      sourceId: input.nonce,
      amountMoney: {
        amount: BigInt(input.amountCents),
        currency: "CAD",
      },
      locationId: creds.locationId,
      note: `ApptType:${input.appointmentTypeId}`,
    };

    try {
      const res = await paymentsApi.createPayment(body);
      const payment = res.result.payment;
      if (!payment) throw new Error("No payment returned");

      return {
        paymentId: payment.id as string,
        status: payment.status as "COMPLETED" | "PENDING",
      };
    } catch (err: any) {
      console.error("Square createPayment error:", err);
      const msg =
        (err.errors?.map((e: any) => e.detail).join(", ")) || err.message;
      throw new Error(`Square createPayment failed: ${msg}`);
    }
  }

  /* ───────── refund a payment ───────── */
  async refundPayment(
    input: RefundPaymentInput,
  ): Promise<{ refundId: string; status: "COMPLETED" | "PENDING" | "FAILED" }> {
    const { ownerType, ownerId, paymentId, reason } = input;
    const creds = await this.getCredential(ownerType, ownerId);

    const client = new Client({
      accessToken: creds.accessToken,
      environment: Environment.Sandbox,
      squareVersion: "2025-05-21",
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const paymentsApi = client.paymentsApi ?? client.payments;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const refundsApi = client.refundsApi ?? client.refunds;
    if (!refundsApi?.refundPayment) {
      throw new Error("Square SDK refunds API not available on client");
    }

    /* 1️⃣  Get the original payment to know amount/currency */
    const payRes = await paymentsApi.getPayment(paymentId);
    const payment = payRes.result.payment;
    if (!payment?.amountMoney?.amount) throw new Error("Payment not found");

    const originalAmount = BigInt(
      payment.amountMoney.amount as unknown as string | number | bigint,
    );
    const currency = payment.amountMoney.currency;

    /* 2️⃣  Issue a full refund */
    const body = {
      idempotencyKey: uuidv4(),
      paymentId,
      amountMoney: {
        amount: originalAmount,
        currency,
      },
      reason: reason ?? "Cancelled via dashboard",
    };

    try {
      const res = await refundsApi.refundPayment(body);
      const refund = res.result.refund;
      if (!refund) throw new Error("No refund returned");

      return {
        refundId: refund.id as string,
        status: (refund.status || "PENDING") as
          | "COMPLETED"
          | "PENDING"
          | "FAILED",
      };
    } catch (err: any) {
      console.error("Square refundPayment error:", err);
      const msg =
        (err.errors?.map((e: any) => e.detail).join(", ")) || err.message;
      throw new Error(`Square refundPayment failed: ${msg}`);
    }
  }
}

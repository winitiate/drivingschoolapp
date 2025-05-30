// functions/src/payments/gateways/SquareGateway.ts
import { Client, Environment } from "square";
import { decrypt } from "../../utils/encryption";
import { getFirestore } from "firebase-admin/firestore";
import { PaymentGateway, CreatePaymentInput } from "./PaymentGateway";

export class SquareGateway implements PaymentGateway {
  /** Fetch the encrypted credential from Firestore and decrypt it. */
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

  async createPayment(input: CreatePaymentInput) {
    const creds = await this.getCredential(input.ownerType, input.ownerId);

    const client = new Client({
      accessToken: creds.accessToken,
      environment: Environment.Sandbox, // enum ✔
      squareVersion: "2025-05-21",      // same version that worked with curl
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore  v17 exposes either .paymentsApi or .payments
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
}

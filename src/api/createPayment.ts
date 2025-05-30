// ----------------------------------------------------------------------------
// src/api/createPayment.ts
// ----------------------------------------------------------------------------
// Front-end helper for calling your Cloud Function.
// ----------------------------------------------------------------------------

interface CreatePaymentBody {
  ownerType: "serviceLocation";
  ownerId: string;
  appointmentTypeId: string;
  amountCents: number;
  nonce: string;
}

interface CreatePaymentResult {
  paymentId: string;
  status: "COMPLETED" | "PENDING";
}

const API_BASE = import.meta.env.VITE_API_BASE;
if (!API_BASE) {
  throw new Error(
    "VITE_API_BASE is not defined – create a .env.local with VITE_API_BASE set"
  );
}

export async function createPayment(
  body: CreatePaymentBody
): Promise<CreatePaymentResult> {
  const url = `${API_BASE}/createPayment`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // try structured JSON error, otherwise text
    let err: any;
    try {
      err = await res.json();
    } catch {
      err = { error: await res.text() };
    }
    throw new Error(err.error || err.message || "Payment failed");
  }
  return res.json();
}

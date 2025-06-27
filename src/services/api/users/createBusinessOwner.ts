import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase";

interface Input {
  email: string;
  businessId: string;
}

interface Output {
  success: boolean;
  uid: string;
}

export async function createBusinessOwner(data: Input): Promise<string> {
  const fn = httpsCallable<Input, Output>(functions, "createBusinessOwner");
  const { data: res } = await fn(data);
  return res.uid;
}

// functions-users/src/types/businessOwner.types.ts

export interface CreateBusinessOwnerInput {
  email: string;
  businessId?: string;
}

export interface CreateBusinessOwnerResult {
  success: boolean;
  uid: string;
}

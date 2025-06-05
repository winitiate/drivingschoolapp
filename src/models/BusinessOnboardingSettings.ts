// src/models/BusinessOnboardingSettings.ts

/**
 * This interface represents the single Firestore document at:
 *     /settings/businessOnboarding
 *
 * It controls whether new businesses can self-register (publicly),
 * or only a Super-Admin can create them.
 */
export interface BusinessOnboardingSettings {
  allowSelfRegistration: boolean;
}

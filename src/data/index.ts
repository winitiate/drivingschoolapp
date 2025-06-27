/**
 * data/index.ts
 *
 * Barrel file exporting all data store interfaces, implementations,
 * and ready-to-use singleton instances.
 */

// Interfaces & classes
export * from "./AppointmentStore";
export * from "./FirestoreAppointmentStore";

export * from "./AppointmentTypeStore";
export * from "./FirestoreAppointmentTypeStore";

export * from "./AssessmentStore";
export * from "./FirestoreAssessmentStore";

export * from "./AssetStore";
export * from "./FirestoreAssetStore";

export * from "./BusinessStore";
export * from "./FirestoreBusinessStore";

export * from "./ClientStore";
export * from "./FirestoreClientStore";

export * from "./FaqStore";
export * from "./FirestoreFaqStore";

export * from "./FormTemplateStore";
export * from "./FirestoreFormTemplateStore";

export * from "./GradingScaleStore";
export * from "./FirestoreGradingScaleStore";

export * from "./NotificationStore";
export * from "./FirestoreNotificationStore";

export * from "./PackageStore";
export * from "./FirestorePackageStore";

export * from "./PaymentStore";
export * from "./FirestorePaymentStore";

export * from "./ServiceLocationStore";
export * from "./FirestoreServiceLocationStore";

export * from "./ServiceProviderStore";
export * from "./FirestoreServiceProviderStore";

// Singleton instances
import { FirestoreAppointmentStore }       from "./FirestoreAppointmentStore";
import { FirestoreAppointmentTypeStore }   from "./FirestoreAppointmentTypeStore";
import { FirestoreAssessmentStore }        from "./FirestoreAssessmentStore";
import { FirestoreAssetStore }             from "./FirestoreAssetStore";
import { FirestoreBusinessStore }          from "./FirestoreBusinessStore";
import { FirestoreClientStore }            from "./FirestoreClientStore";
import { FirestoreFAQStore }               from "./FirestoreFaqStore";
import { FirestoreFormTemplateStore }      from "./FirestoreFormTemplateStore";
import { FirestoreGradingScaleStore }      from "./FirestoreGradingScaleStore";
import { FirestoreNotificationStore }      from "./FirestoreNotificationStore";
import { FirestorePackageStore }           from "./FirestorePackageStore";
import { FirestorePaymentStore }           from "./FirestorePaymentStore";
import { FirestoreServiceLocationStore }   from "./FirestoreServiceLocationStore";
import { FirestoreServiceProviderStore }   from "./FirestoreServiceProviderStore";

export const appointmentStore         = new FirestoreAppointmentStore();
export const appointmentTypeStore     = new FirestoreAppointmentTypeStore();
export const assessmentStore          = new FirestoreAssessmentStore();
export const assetStore               = new FirestoreAssetStore();
export const businessStore            = new FirestoreBusinessStore();
export const clientStore              = new FirestoreClientStore();
export const faqStore                 = new FirestoreFAQStore();
export const formTemplateStore        = new FirestoreFormTemplateStore();
export const gradingScaleStore        = new FirestoreGradingScaleStore();
export const notificationStore        = new FirestoreNotificationStore();
export const packageStore             = new FirestorePackageStore();
export const paymentStore             = new FirestorePaymentStore();
export const serviceLocationStore     = new FirestoreServiceLocationStore();
export const serviceProviderStore     = new FirestoreServiceProviderStore();

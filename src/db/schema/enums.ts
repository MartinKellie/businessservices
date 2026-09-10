import { pgEnum } from 'drizzle-orm/pg-core';

/** Lifecycle of a business listing (scope §19). */
export const businessStatus = pgEnum('business_status', [
  'draft',
  'active',
  'temporarily_closed',
  'permanently_closed',
  'relocated',
  'archived',
]);

/** Internal verification confidence (scope §23). Never shown publicly. */
export const verificationLevel = pgEnum('verification_level', [
  'researched',
  'contacted',
  'phone_verified',
  'visited',
  'business_claimed',
]);

/** How a business was verified (scope §23). */
export const verificationMethod = pgEnum('verification_method', [
  'public_information',
  'phone_call',
  'shop_visit',
  'local_contact',
  'business_confirmation',
  'other',
]);

/** Whether a premises is a fixed shopfront or a mobile/service operation (scope §10, §20). */
export const premisesKind = pgEnum('premises_kind', ['physical', 'service_area']);

/** Precision of a premises location (scope §10). */
export const locationPrecision = pgEnum('location_precision', [
  'exact',
  'approximate',
  'area_only',
]);

/** Approval state for editor-requested taxonomy entries (scope §7–9, §26). */
export const taxonomyStatus = pgEnum('taxonomy_status', ['pending', 'approved', 'rejected']);

/** Scope of a synonym/alias (scope §9). */
export const synonymScope = pgEnum('synonym_scope', ['global', 'product_service', 'category']);

/** Admin roles (scope §26). */
export const adminRole = pgEnum('admin_role', ['owner', 'editor']);

/** Business media kind (scope §16, §17). */
export const mediaType = pgEnum('media_type', ['logo', 'photo']);

/** Where a piece of media came from. */
export const mediaSource = pgEnum('media_source', ['admin', 'enquiry']);

/** Review state for uploaded images (scope §17, §35). */
export const mediaReviewStatus = pgEnum('media_review_status', ['pending', 'approved', 'rejected']);

/** Contact-history channel (scope §29). */
export const contactMethod = pgEnum('contact_method', [
  'phone',
  'whatsapp',
  'email',
  'visit',
  'other',
]);

/** Public contact-form enquiry type (scope §33). */
export const enquiryType = pgEnum('enquiry_type', [
  'add_business',
  'update_listing',
  'advertising',
  'general',
]);

/** Enquiry handling status (scope §34). */
export const enquiryStatus = pgEnum('enquiry_status', ['new', 'in_progress', 'closed']);

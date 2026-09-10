CREATE TYPE "public"."admin_role" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('draft', 'active', 'temporarily_closed', 'permanently_closed', 'relocated', 'archived');--> statement-breakpoint
CREATE TYPE "public"."contact_method" AS ENUM('phone', 'whatsapp', 'email', 'visit', 'other');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'in_progress', 'closed');--> statement-breakpoint
CREATE TYPE "public"."enquiry_type" AS ENUM('add_business', 'update_listing', 'advertising', 'general');--> statement-breakpoint
CREATE TYPE "public"."location_precision" AS ENUM('exact', 'approximate', 'area_only');--> statement-breakpoint
CREATE TYPE "public"."media_review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."media_source" AS ENUM('admin', 'enquiry');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('logo', 'photo');--> statement-breakpoint
CREATE TYPE "public"."premises_kind" AS ENUM('physical', 'service_area');--> statement-breakpoint
CREATE TYPE "public"."synonym_scope" AS ENUM('global', 'product_service', 'category');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."verification_level" AS ENUM('researched', 'contacted', 'phone_verified', 'visited', 'business_claimed');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('public_information', 'phone_call', 'shop_visit', 'local_contact', 'business_confirmation', 'other');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"name_normalised" text GENERATED ALWAYS AS (search_normalise(name)) STORED,
	"centroid" geography(Point,4326),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"name_normalised" text GENERATED ALWAYS AS (search_normalise(name)) STORED,
	"status" "business_status" DEFAULT 'draft' NOT NULL,
	"relocated_to_business_id" uuid,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"website" text,
	"instagram" text,
	"facebook" text,
	"verification_level" "verification_level",
	"verification_method" "verification_method",
	"last_verified_at" timestamp with time zone,
	"verification_source" text,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('spanish', f_unaccent(coalesce(name, '')))) STORED,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "opening_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"premises_id" uuid,
	"day_of_week" smallint NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opening_hours_day_of_week_range" CHECK ("opening_hours"."day_of_week" between 1 and 7)
);
--> statement-breakpoint
CREATE TABLE "premises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"kind" "premises_kind" DEFAULT 'physical' NOT NULL,
	"label" text,
	"address_line" text,
	"area_id" uuid,
	"location" geography(Point,4326),
	"location_precision" "location_precision",
	"service_area_note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_categories" (
	"business_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "business_categories_business_id_category_id_pk" PRIMARY KEY("business_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "business_products_services" (
	"business_id" uuid NOT NULL,
	"product_service_id" uuid NOT NULL,
	CONSTRAINT "business_products_services_business_id_product_service_id_pk" PRIMARY KEY("business_id","product_service_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"name_normalised" text GENERATED ALWAYS AS (search_normalise(name)) STORED,
	"fallback_icon" text,
	"fallback_image_url" text,
	"is_popular" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('spanish', f_unaccent(coalesce(name, '')))) STORED,
	"status" "taxonomy_status" DEFAULT 'approved' NOT NULL,
	"requested_by" uuid,
	"requested_at" timestamp with time zone,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"name_normalised" text GENERATED ALWAYS AS (search_normalise(name)) STORED,
	"description" text,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('spanish', f_unaccent(coalesce(name, '')))) STORED,
	"status" "taxonomy_status" DEFAULT 'approved' NOT NULL,
	"requested_by" uuid,
	"requested_at" timestamp with time zone,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_services_name_unique" UNIQUE("name"),
	CONSTRAINT "products_services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "synonyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" text NOT NULL,
	"term_normalised" text GENERATED ALWAYS AS (search_normalise(term)) STORED,
	"scope" "synonym_scope" DEFAULT 'global' NOT NULL,
	"product_service_id" uuid,
	"category_id" uuid,
	"notes" text,
	"status" "taxonomy_status" DEFAULT 'approved' NOT NULL,
	"requested_by" uuid,
	"requested_at" timestamp with time zone,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "synonyms_term_scope_target" UNIQUE NULLS NOT DISTINCT("term_normalised","scope","product_service_id","category_id"),
	CONSTRAINT "synonyms_scope_target" CHECK ((
        ("synonyms"."scope" = 'global' and "synonyms"."product_service_id" is null and "synonyms"."category_id" is null)
        or ("synonyms"."scope" = 'product_service' and "synonyms"."product_service_id" is not null and "synonyms"."category_id" is null)
        or ("synonyms"."scope" = 'category' and "synonyms"."category_id" is not null and "synonyms"."product_service_id" is null)
      ))
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"role" "admin_role" DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "contact_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"author_id" uuid,
	"contacted_on" date DEFAULT now() NOT NULL,
	"method" "contact_method" NOT NULL,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"due_on" date NOT NULL,
	"note" text,
	"created_by" uuid,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" "media_type" NOT NULL,
	"source" "media_source" DEFAULT 'admin' NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"content_type" text,
	"byte_size" integer,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"review_status" "media_review_status" DEFAULT 'pending' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"uploaded_by" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "enquiry_type" NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"business_reference" text,
	"business_id" uuid,
	"consent_given" boolean NOT NULL,
	"consent_policy_version" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"admin_notes" text,
	"handled_by" uuid,
	"purge_after" timestamp with time zone,
	"soft_deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiry_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"content_type" text,
	"byte_size" integer,
	"review_status" "media_review_status" DEFAULT 'pending' NOT NULL,
	"promoted_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"approval_required_categories" boolean DEFAULT true NOT NULL,
	"approval_required_products" boolean DEFAULT true NOT NULL,
	"approval_required_synonyms" boolean DEFAULT true NOT NULL,
	"public_last_updated_visible" boolean DEFAULT false NOT NULL,
	"near_me_radius_meters" integer DEFAULT 5000 NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"announcement_enabled" boolean DEFAULT false NOT NULL,
	"announcement_text" text DEFAULT '' NOT NULL,
	"enquiry_retention_months" integer DEFAULT 12 NOT NULL,
	"enquiry_deletion_grace_days" integer DEFAULT 30 NOT NULL,
	"privacy_policy_version" text DEFAULT '1' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_singleton" CHECK ("system_settings"."id" = 'global')
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_relocated_to_business_id_businesses_id_fk" FOREIGN KEY ("relocated_to_business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_premises_id_premises_id_fk" FOREIGN KEY ("premises_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premises" ADD CONSTRAINT "premises_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premises" ADD CONSTRAINT "premises_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_products_services" ADD CONSTRAINT "business_products_services_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_products_services" ADD CONSTRAINT "business_products_services_product_service_id_products_services_id_fk" FOREIGN KEY ("product_service_id") REFERENCES "public"."products_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_requested_by_admin_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_services" ADD CONSTRAINT "products_services_requested_by_admin_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_services" ADD CONSTRAINT "products_services_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synonyms" ADD CONSTRAINT "synonyms_product_service_id_products_services_id_fk" FOREIGN KEY ("product_service_id") REFERENCES "public"."products_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synonyms" ADD CONSTRAINT "synonyms_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synonyms" ADD CONSTRAINT "synonyms_requested_by_admin_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "synonyms" ADD CONSTRAINT "synonyms_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_history" ADD CONSTRAINT "contact_history_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_history" ADD CONSTRAINT "contact_history_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_completed_by_admin_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_media" ADD CONSTRAINT "business_media_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_media" ADD CONSTRAINT "business_media_uploaded_by_admin_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_media" ADD CONSTRAINT "business_media_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_handled_by_admin_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_uploads" ADD CONSTRAINT "enquiry_uploads_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_uploads" ADD CONSTRAINT "enquiry_uploads_promoted_media_id_business_media_id_fk" FOREIGN KEY ("promoted_media_id") REFERENCES "public"."business_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "areas_name_trgm_idx" ON "areas" USING gin ("name_normalised" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "areas_centroid_idx" ON "areas" USING gist ("centroid");--> statement-breakpoint
CREATE INDEX "businesses_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "businesses_name_trgm_idx" ON "businesses" USING gin ("name_normalised" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "businesses_search_vector_idx" ON "businesses" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "businesses_relocated_to_idx" ON "businesses" USING btree ("relocated_to_business_id");--> statement-breakpoint
CREATE INDEX "opening_hours_business_day_idx" ON "opening_hours" USING btree ("business_id","day_of_week");--> statement-breakpoint
CREATE INDEX "premises_business_idx" ON "premises" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "premises_area_idx" ON "premises" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "premises_location_idx" ON "premises" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "premises_one_active_per_business" ON "premises" USING btree ("business_id") WHERE "premises"."is_active";--> statement-breakpoint
CREATE INDEX "business_categories_category_idx" ON "business_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_categories_one_primary" ON "business_categories" USING btree ("business_id") WHERE "business_categories"."is_primary";--> statement-breakpoint
CREATE INDEX "business_products_services_ps_idx" ON "business_products_services" USING btree ("product_service_id");--> statement-breakpoint
CREATE INDEX "categories_name_trgm_idx" ON "categories" USING gin ("name_normalised" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "categories_search_vector_idx" ON "categories" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "categories_status_idx" ON "categories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_services_name_trgm_idx" ON "products_services" USING gin ("name_normalised" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "products_services_search_vector_idx" ON "products_services" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "products_services_status_idx" ON "products_services" USING btree ("status");--> statement-breakpoint
CREATE INDEX "synonyms_term_trgm_idx" ON "synonyms" USING gin ("term_normalised" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "contact_history_business_idx" ON "contact_history" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "follow_ups_due_idx" ON "follow_ups" USING btree ("due_on") WHERE "follow_ups"."completed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "follow_ups_one_open_per_business" ON "follow_ups" USING btree ("business_id") WHERE "follow_ups"."completed_at" is null;--> statement-breakpoint
CREATE INDEX "internal_notes_business_idx" ON "internal_notes" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_media_business_idx" ON "business_media" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_media_publishable_idx" ON "business_media" USING btree ("business_id","type","sort_order") WHERE "business_media"."review_status" = 'approved';--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enquiries_type_idx" ON "enquiries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enquiries_lifecycle_idx" ON "enquiries" USING btree ("soft_deleted_at","purge_after");--> statement-breakpoint
CREATE INDEX "enquiry_uploads_enquiry_idx" ON "enquiry_uploads" USING btree ("enquiry_id");
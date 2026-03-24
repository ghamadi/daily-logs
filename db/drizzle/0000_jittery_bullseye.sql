CREATE TABLE "auth_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(64) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(160),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_users_role_chk" CHECK ("workspace_users"."role" in (0, 1, 2, 3))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" smallint DEFAULT 1 NOT NULL,
	"status" smallint DEFAULT 2 NOT NULL,
	"happened_at" timestamp with time zone NOT NULL,
	"summary" varchar(280) DEFAULT '' NOT NULL,
	"source" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_type_chk" CHECK ("events"."type" in (0, 1)),
	CONSTRAINT "events_status_chk" CHECK ("events"."status" in (0, 1, 2, 3))
);
--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_provider_provider_user_id_uq" ON "auth_identities" USING btree ("user_id","provider","provider_user_id");--> statement-breakpoint
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "workspaces_name_idx" ON "workspaces" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_users_workspace_id_user_id_uq" ON "workspace_users" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_users_user_id_idx" ON "workspace_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_workspace_id_happened_at_idx" ON "events" USING btree ("workspace_id","happened_at");--> statement-breakpoint
CREATE INDEX "events_workspace_id_type_happened_at_idx" ON "events" USING btree ("workspace_id","type","happened_at");--> statement-breakpoint
CREATE INDEX "events_workspace_id_status_happened_at_idx" ON "events" USING btree ("workspace_id","status","happened_at");
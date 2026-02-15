CREATE TABLE "events_data" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"message_id" bigint,
	"type" smallint DEFAULT 1 NOT NULL,
	"status" smallint DEFAULT 2 NOT NULL,
	"happened_at" timestamp with time zone NOT NULL,
	"summary" varchar(280) DEFAULT '' NOT NULL,
	"confidence" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_type_chk" CHECK ("events"."type" in (0, 1)),
	CONSTRAINT "events_status_chk" CHECK ("events"."status" in (0, 1, 2, 3)),
	CONSTRAINT "events_confidence_range_chk" CHECK ("events"."confidence" is null or ("events"."confidence" between 0 and 100))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"channel" smallint DEFAULT 0 NOT NULL,
	"direction" smallint DEFAULT 0 NOT NULL,
	"type" smallint DEFAULT 1 NOT NULL,
	"external_id" varchar(200),
	"content" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_channel_chk" CHECK ("messages"."channel" in (0, 1, 2, 3)),
	CONSTRAINT "messages_direction_chk" CHECK ("messages"."direction" in (0, 1, 2)),
	CONSTRAINT "messages_type_chk" CHECK ("messages"."type" in (0, 1, 2, 3, 4, 10))
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
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events_data" ADD CONSTRAINT "events_data_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_workspace_id_happened_at_idx" ON "events" USING btree ("workspace_id","happened_at");--> statement-breakpoint
CREATE INDEX "events_workspace_id_type_happened_at_idx" ON "events" USING btree ("workspace_id","type","happened_at");--> statement-breakpoint
CREATE INDEX "events_workspace_id_status_happened_at_idx" ON "events" USING btree ("workspace_id","status","happened_at");--> statement-breakpoint
CREATE INDEX "events_message_id_idx" ON "events" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "messages_workspace_id_created_at_idx" ON "messages" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_workspace_id_channel_idx" ON "messages" USING btree ("workspace_id","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_workspace_id_channel_external_id_uq" ON "messages" USING btree ("workspace_id","channel","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_users_workspace_id_user_id_uq" ON "workspace_users" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_users_user_id_idx" ON "workspace_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "workspaces_name_idx" ON "workspaces" USING btree ("name");
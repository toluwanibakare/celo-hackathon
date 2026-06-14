CREATE TABLE IF NOT EXISTS "Bill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"dueDate" timestamp NOT NULL,
	"frequency" varchar(32) DEFAULT 'monthly' NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "OtpVerification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SavingsGoal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"targetAmount" numeric(18, 2) NOT NULL,
	"currentAmount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"targetDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"token" varchar(8) DEFAULT 'cUSD' NOT NULL,
	"status" varchar(16) DEFAULT 'completed' NOT NULL,
	"txHash" varchar(66),
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "phoneNumber" varchar(32);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "walletPrivateKey" varchar(128);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_phoneNumber_unique" UNIQUE("phoneNumber");
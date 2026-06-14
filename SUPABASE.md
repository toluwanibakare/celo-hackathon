# Supabase Setup for Paycon

The database tables for Paycon have been successfully created and configured on Supabase! 

## Connection Details
- **Project Name:** Paycon
- **Project Ref:** `tsavbpshxgygrwytwyne`
- **Database Host:** `db.tsavbpshxgygrwytwyne.supabase.co`
- **Region:** `eu-west-1` (Ireland)
- **Engine Version:** Postgres 17

---

## Configuration

To connect the application to your Supabase instance, update your `.env.local` file (or `.env`) with the connection string:

```env
# Supabase connection string (transaction pooler or direct connection)
POSTGRES_URL="postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.tsavbpshxgygrwytwyne.supabase.co:6543/postgres?sslmode=require"
```

> [!IMPORTANT]
> Replace `[YOUR-DATABASE-PASSWORD]` with the password you set when creating the Supabase project.

---

## Active Tables

The following tables are active on your Supabase instance:
- **`public.User`** - Stores users, hashed passwords, phone numbers, and Celo wallet private keys.
- **`public.SavingsGoal`** - Stores savings goals, targets, dates, and progress.
- **`public.Bill`** - Stores upcoming and recurring bills.
- **`public.Transaction`** - Logs simulated and on-chain Celo transactions.
- **`public.OtpVerification`** - Stores OTP verification codes for secure actions.
- **`public.Chat`**, **`public.Message_v2`**, **`public.Stream`**, **`public.Suggestion`**, **`public.Document`** - Main AI chat logging tables.

---

## Commands

If you make any local changes to `lib/db/schema.ts` in the future:

1. **Generate a local migration:**
   ```bash
   pnpm db:generate
   ```
2. **Apply the migrations to Supabase:**
   ```bash
   pnpm db:migrate
   ```
   *(Ensure `POSTGRES_URL` is set in `.env.local` when running this).*

# Paycon: AI Driven Stablecoin Savings and Automated Bill Manager

Paycon is a premium Web3 fintech application built on Celo Sepolia that combines automated, yield bearing stablecoin savings goals, scheduling and executing real world bill payments on chain, and an AI powered financial coach accessible both via a web dashboard and WhatsApp.

## What is Paycon and How It Works

Paycon enables users to manage their digital assets with premium UX:
1. ATM style Celo Wallet Card: A responsive 3D flipping ATM card displaying the user's Celo Sepolia address (printed like a card number), EMV chip details, live on chain balances (USDm and USDC), and actions.
2. Segregated Savings Goal Vaults: Every savings goal created automatically spins up its own dedicated Celo wallet serving as an on chain vault. The AI agent can contribute stablecoins from the user's main wallet directly to these vault addresses on chain.
3. On chain Bill Payments: Schedule bills and pay them on chain using Celo's ultra low gas fees and fast block times.
4. WhatsApp AI Financial Coach via n8n: Users can chat with their financial coach, query balances, create goals, contribute to savings, and pay bills in natural language using WhatsApp.

## Tech Stack

- Frontend and Backend: Next.js 15 (App Router) with TypeScript
- Database Layer: PostgreSQL with Drizzle ORM
- Cloud Database: Supabase (PG Connection Pooling via AWS Pooler)
- On chain Interactions: Viem and Thirdweb SDKs (Celo Sepolia Testnet)
- Email Service: Nodemailer (Gmail SMTP) for OTP and transaction receipts
- AI Orchestration and Automations: n8n workflows handling the WhatsApp message routing, user session state, tools invocation, and stablecoin transactions
- Chat Interface: WhatsApp Business Cloud API (Meta Developer Platform)

## Chatting with Paycon on WhatsApp (MVP Whitelisting)

For the MVP, we are using a sandbox test number from Meta. To interact with Paycon on WhatsApp:

1. Send a message containing any text on WhatsApp to the sandbox number: +2348026322742.
2. Meta requires you to send this initial message to whitelist your phone number for receiving inbound messages from the sandbox sender.
3. Once whitelisted, the AI Agent will respond and guide you through tracking your savings and executing bills.

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Environment Variables
Create a .env.local or .env file in the root directory:
```env
# Database Credentials
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepare=false"
POSTGRES_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepare=false"

# AI Provider Keys
OPENAI_API_KEY=your_openai_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# Authentication
AUTH_SECRET=your_auth_secret

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# WhatsApp AI Agent Config
NEXT_PUBLIC_AI_AGENT_WHATSAPP=+2348026322742
```

### 3. Start Development Server
```bash
pnpm dev
```
Open http://localhost:3000 in your browser.

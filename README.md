# Paycon: The Intelligent Financial Companion for Stablecoins and Bills

Welcome to Paycon, a smart personal finance dashboard and conversational assistant built on the Celo network. Paycon helps you automate your savings goals, schedule real world bill payments, and build financial habits using digital dollars. 

Paycon brings a premium Web3 fintech experience directly to your browser and your favorite messaging app, WhatsApp.

---

## How Paycon Works

Paycon is built around three core pillars designed to make Web3 personal finance intuitive, visual, and automated:

### 1. The Interactive ATM Card
The centerpiece of your dashboard is a realistic, 3D flipping ATM card. 
- The front of the card displays your Celo Sepolia address styled like a traditional card number, your EMV chip, and active status.
- Tap or click the card to flip it over. The back reveals your live digital dollar balances (USDm and USDC), a quick copy button for your address, and options to fund your wallet or view the block explorer.

### 2. Goal Oriented Vaults
Saving is easier when it is segregated. 
- When you create a savings goal (like saving for a new laptop), Paycon automatically generates a unique on chain wallet specifically for that goal.
- This vault acts as a dedicated digital piggy bank. When you contribute to a goal, stablecoins are transferred from your primary wallet to the goal vault.

### 3. Automated Bill Payments
Never miss a due date.
- Schedule your regular bills (utility, rent, internet) on the platform.
- When it is time to pay, Paycon executes a secure on chain stablecoin transfer to the merchant using Celo's fast block times and low network fees.

---

## The Conversational AI Assistant

You do not need to open the dashboard to manage your finances. Paycon features an AI companion that runs inside WhatsApp. 

### How the AI Operates
- Paycon uses a secure automation framework powered by n8n.
- When you message the AI on WhatsApp, n8n processes your natural language requests.
- The AI is equipped with tools to securely interact with the blockchain and database on your behalf. 
- For example, you can text the AI "Move ten dollars to my Laptop savings goal" or "Do I have any bills due this week?", and it will call the appropriate on chain tools to execute the action.

---

## Getting Started with the WhatsApp MVP

For the MVP, Paycon uses a sandbox number from Meta. To start chatting with your AI financial coach:

1. Add the sandbox number to your contacts: **+2348026322742**.
2. Send a WhatsApp message containing any text (such as "Hello") to this number.
3. This initial message is required by Meta to whitelist your phone number so you can receive messages back from the sandbox.
4. Try typing these commands to start your financial journey:
   - "What is my current wallet balance?"
   - "Create a savings goal named Summer Vacation with a target of five hundred dollars"
   - "Contribute fifty dollars to my Summer Vacation goal"
   - "Show my upcoming bills"

---

## Technology Stack

Paycon leverages modern web and blockchain infrastructure to deliver a fast and secure experience:

- **Web Application:** Next.js 15 App Router with TypeScript
- **Database & Hosting:** Supabase PostgreSQL database managed with Drizzle ORM
- **Blockchain Connectivity:** Viem and Thirdweb SDKs deployed on Celo Sepolia
- **Security:** Node Mailer Gmail SMTP for secure OTP logins and transactional email receipts
- **Automations:** n8n workflow management for routing WhatsApp messages and executing blockchain functions
- **Messaging Interface:** Meta WhatsApp Business Cloud API

---

## Setup and Installation

Follow these steps to run the Paycon dashboard locally:

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Environment Variables
Create a `.env.local` or `.env` file in the root directory:
```env
# Database Connections
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepare=false"
POSTGRES_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepare=false"

# AI Provider API Keys
OPENAI_API_KEY=your_openai_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# Authentication Secrets
AUTH_SECRET=your_auth_secret

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# WhatsApp AI Agent Configuration
NEXT_PUBLIC_AI_AGENT_WHATSAPP=+2348026322742
```

### 3. Run the App
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view your dashboard.

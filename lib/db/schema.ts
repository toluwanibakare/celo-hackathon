import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  numeric,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }),
  password: varchar('password', { length: 64 }),
  walletAddress: varchar('walletAddress', { length: 64 }).unique(),
  phoneNumber: varchar('phoneNumber', { length: 32 }).unique(),
  walletPrivateKey: varchar('walletPrivateKey', { length: 128 }),
  // On-chain balance snapshot — updated every time /api/paycon/balance is called
  balanceCUSD: numeric('balanceCUSD', { precision: 18, scale: 8 }).default('0'),
  balanceUSDC: numeric('balanceUSDC', { precision: 18, scale: 8 }).default('0'),
  balanceCELO: numeric('balanceCELO', { precision: 18, scale: 8 }).default('0'),
  balanceUpdatedAt: timestamp('balanceUpdatedAt'),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// Paycon-specific tables
export const savingsGoal = pgTable('SavingsGoal', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  title: text('goal_name').notNull(), // Map drizzle title to goal_name column in Postgres
  targetAmount: numeric('targetAmount', { precision: 18, scale: 2 }).notNull(),
  currentAmount: numeric('currentAmount', { precision: 18, scale: 2 }).notNull().default('0'),
  targetDate: timestamp('targetDate').notNull(),
  vaultAddress: varchar('vaultAddress', { length: 66 }),
  vaultPrivateKey: varchar('vaultPrivateKey', { length: 128 }),
  walletAddress: varchar('walletAddress', { length: 66 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type SavingsGoal = InferSelectModel<typeof savingsGoal>;

export const bill = pgTable('Bill', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  dueDate: timestamp('dueDate').notNull(),
  frequency: varchar('frequency', { length: 32 }).notNull().default('monthly'), // 'monthly', 'weekly', 'once'
  isPaid: boolean('isPaid').notNull().default(false),
  walletAddress: varchar('walletAddress', { length: 66 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Bill = InferSelectModel<typeof bill>;

export const transaction = pgTable('Transaction', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  type: varchar('type', { length: 32 }).notNull(), // 'deposit', 'withdrawal', 'bill_payment', 'savings_contribution'
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  token: varchar('token', { length: 8 }).notNull().default('cUSD'), // 'cUSD', 'USDC'
  status: varchar('status', { length: 16 }).notNull().default('completed'), // 'pending', 'completed', 'failed'
  txHash: varchar('txHash', { length: 66 }),
  description: text('description'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Transaction = InferSelectModel<typeof transaction>;

export const otpVerification = pgTable('OtpVerification', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  otp: varchar('otp', { length: 6 }).notNull(),
  purpose: varchar('purpose', { length: 32 }).notNull(), // 'view_balance', 'payment', 'withdrawal'
  expiresAt: timestamp('expiresAt').notNull(),
  isVerified: boolean('isVerified').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type OtpVerification = InferSelectModel<typeof otpVerification>;

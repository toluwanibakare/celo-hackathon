import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  lt,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import {
  chat,
  type Chat,
  type DBMessage,
  document,
  message,
  stream,
  suggestion,
  user,
  type User,
  savingsGoal,
  type SavingsGoal,
  bill,
  type Bill,
  transaction,
  type Transaction,
  otpVerification,
  type OtpVerification,
} from "./schema";
import { mockDb } from "./mockDb";

export const PUBLIC_USER_ID = "11111111-1111-1111-1111-111111111111";
export const PUBLIC_USER_EMAIL = "public@local";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const isMockMode =
  !dbUrl ||
  dbUrl === "****" ||
  dbUrl.includes("placeholder") ||
  dbUrl.includes("your_postgres");

let db: any = null;
let client: any = null;

if (!isMockMode) {
  try {
    client = postgres(dbUrl as string, { prepare: false });
    db = drizzle(client);
  } catch (error) {
    console.warn("Database connection failed, falling back to mock mode:", error);
  }
}

// --- EXISTING USER QUERIES ---

export async function getUser(email: string): Promise<Array<User>> {
  if (!db) return mockDb.getUser(email);
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error: any) {
    throw new ChatSDKError("bad_request:database", error?.message || String(error));
  }
}

export async function getOrCreateUserByWalletAddress({
  walletAddress,
}: {
  walletAddress: string;
}): Promise<User> {
  if (!db) return mockDb.getOrCreateUserByWalletAddress(walletAddress);
  const addr = walletAddress.toLowerCase();
  try {
    const [existing] = await db
      .select()
      .from(user)
      .where(sql`lower(${user.walletAddress}) = ${addr}`)
      .limit(1);

    if (existing) {
      if ((existing as User).walletAddress !== addr) {
        const [updated] = await db
          .update(user)
          .set({ walletAddress: addr as any })
          .where(eq(user.id, (existing as User).id))
          .returning();
        return updated as User;
      }
      return existing as User;
    }

    const [created] = await db
      .insert(user)
      .values({ walletAddress: addr as any })
      .returning();

    return created as User;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get or create user by wallet address");
  }
}

export async function getOrCreatePublicUser() {
  if (!db) return mockDb.getOrCreatePublicUser();
  try {
    const existing = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.id, PUBLIC_USER_ID))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db
      .insert(user)
      .values({ id: PUBLIC_USER_ID as any, email: PUBLIC_USER_EMAIL })
      .returning({ id: user.id, email: user.email });

    return created;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get or create public user");
  }
}

export async function createUser(
  email: string,
  passwordHash: string,
  phoneNumber?: string,
  walletAddress?: string,
  walletPrivateKey?: string
): Promise<Array<User>> {
  if (!db) return mockDb.createUser(email, passwordHash, phoneNumber, walletAddress, walletPrivateKey);
  try {
    return await db
      .insert(user)
      .values({
        email,
        password: passwordHash,
        phoneNumber: phoneNumber || null,
        walletAddress: walletAddress || null,
        walletPrivateKey: walletPrivateKey || null,
      })
      .returning();
  } catch (error: any) {
    throw new ChatSDKError("bad_request:database", error?.message || String(error));
  }
}

// --- EXISTING CHAT QUERIES ---

export async function getChatsByWalletAddress({
  walletAddress,
  limit,
  startingAfter,
  endingBefore,
}: {
  walletAddress: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  if (!db) {
    return {
      chats: mockDb.getChatsByWalletAddress(walletAddress, limit),
      hasMore: false,
    };
  }
  try {
    const addr = walletAddress.toLowerCase();
    const extendedLimit = limit + 1;

    const baseQuery = (whereCondition?: SQL<any>) =>
      db
        .select({
          id: chat.id,
          createdAt: chat.createdAt,
          title: chat.title,
          userId: chat.userId,
          visibility: chat.visibility,
        })
        .from(chat)
        .innerJoin(user, eq(chat.userId, user.id))
        .where(
          whereCondition
            ? and(whereCondition, sql`lower(${user.walletAddress}) = ${addr}`)
            : sql`lower(${user.walletAddress}) = ${addr}`
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError("not_found:database", `Chat with id ${startingAfter} not found`);
      }
      filteredChats = (await baseQuery(gt(chat.createdAt, selectedChat.createdAt))) as any;
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError("not_found:database", `Chat with id ${endingBefore} not found`);
      }
      filteredChats = (await baseQuery(lt(chat.createdAt, selectedChat.createdAt))) as any;
    } else {
      filteredChats = (await baseQuery()) as any;
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? (filteredChats.slice(0, limit) as any) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chats by wallet address");
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  if (!db) return mockDb.saveChat({ id, userId, title, visibility });
  try {
    return await db.insert(chat).values({
      id,
      userId,
      title,
      visibility,
      createdAt: new Date(),
    });
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  if (!db) return mockDb.deleteChatById(id);
  try {
    await db.delete(message).where(eq(message.chatId, id));
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete chat");
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  if (!db) {
    return {
      chats: [],
      hasMore: false,
    };
  }
  try {
    const extendedLimit = limit + 1;

    const baseQuery = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<any> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError("not_found:database", `Chat with id ${startingAfter} not found`);
      }
      filteredChats = (await baseQuery(gt(chat.createdAt, selectedChat.createdAt))) as any;
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError("not_found:database", `Chat with id ${endingBefore} not found`);
      }
      filteredChats = (await baseQuery(lt(chat.createdAt, selectedChat.createdAt))) as any;
    } else {
      filteredChats = (await baseQuery()) as any;
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chats by user id");
  }
}

export async function getChatById({ id }: { id: string }) {
  if (!db) return mockDb.getChatById(id);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null;
  }
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat as Chat;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

// --- EXISTING MESSAGE QUERIES ---

export async function saveMessages({ messages }: { messages: Array<any> }) {
  if (!db) return mockDb.saveMessages(messages);
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  if (!db) return mockDb.getMessagesByChatId(id);
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get messages by chat id");
  }
}

export async function getMessageById({ id }: { id: string }) {
  if (!db) return null;
  try {
    const [selectedMessage] = await db
      .select()
      .from(message)
      .where(eq(message.id, id));
    return selectedMessage as DBMessage;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get message by id");
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  if (!db) return mockDb.getMessageCountByUserId(id, differenceInHours);
  try {
    const twentyFourHoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);
    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get message count by user id");
  }
}

// --- STREAM ID QUERIES ---

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  if (!db) return mockDb.createStreamId(streamId, chatId);
  try {
    await db.insert(stream).values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to create stream id");
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  if (!db) return mockDb.getStreamIdsByChatId(chatId);
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }: { id: string }) => id);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get stream ids by chat id");
  }
}

export async function reassignChatToUser({ chatId, userId }: { chatId: string; userId: string }) {
  if (!db) return mockDb.reassignChatToUser(chatId, userId);
  try {
    await db.update(chat).set({ userId }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to reassign chat to user");
  }
}

// --- DOCUMENT & SUGGESTION QUERIES (Stubs / minimal support) ---

export async function saveDocument({ id, title, content, kind, userId }: any) {
  if (!db) return null;
  try {
    return await db.insert(document).values({ id, title, content, kind, userId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  if (!db) return [];
  try {
    return await db.select().from(document).where(eq(document.id, id));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get documents by id");
  }
}

export async function getDocumentById({ id }: { id: string }) {
  if (!db) return null;
  try {
    const [selected] = await db.select().from(document).where(eq(document.id, id)).orderBy(desc(document.createdAt)).limit(1);
    return selected;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get document by id");
  }
}

export async function deleteDocumentsByIdAfterTimestamp({ id, timestamp }: any) {
  if (!db) return null;
  try {
    return await db.delete(document).where(and(eq(document.id, id), gte(document.createdAt, timestamp)));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete documents by id after timestamp");
  }
}

export async function saveSuggestions({ suggestions }: { suggestions: any[] }) {
  if (!db) return null;
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to save suggestions");
  }
}

export async function getSuggestionsByDocumentId({ documentId }: any) {
  if (!db) return [];
  try {
    return await db.select().from(suggestion).where(eq(suggestion.documentId, documentId));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get suggestions by document id");
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({ chatId, timestamp }: any) {
  if (!db) return null;
  try {
    return await db.delete(message).where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete messages by chat id after timestamp");
  }
}

export async function updateChatVisiblityById({ id, visibility }: any) {
  if (!db) return null;
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, id));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to update chat visibility by id");
  }
}

// --- PAYCON CUSTOM QUERIES ---

export async function getUserByPhone(phone: string): Promise<User | null> {
  if (!db) return mockDb.getUserByPhone(phone);
  try {
    const [selectedUser] = await db.select().from(user).where(eq(user.phoneNumber, phone));
    return selectedUser as User;
  } catch (error: any) {
    throw new ChatSDKError("bad_request:database", error?.message || String(error));
  }
}

export async function getUserById(id: string): Promise<User | null> {
  if (!db) return mockDb.getUserById(id);
  try {
    const [selectedUser] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return selectedUser || null;
  } catch (error) {
    return null;
  }
}

export async function updateUserWallet(userId: string, address: string, privateKey: string): Promise<User | null> {
  if (!db) return mockDb.updateUserWallet(userId, address, privateKey);
  try {
    const [updatedUser] = await db
      .update(user)
      .set({ walletAddress: address, walletPrivateKey: privateKey })
      .where(eq(user.id, userId))
      .returning();
    return updatedUser || null;
  } catch (error) {
    return null;
  }
}

export async function updateUserPassword(email: string, passwordHash: string): Promise<User | null> {
  if (!db) return mockDb.updateUserPassword(email, passwordHash);
  try {
    const [updatedUser] = await db
      .update(user)
      .set({ password: passwordHash })
      .where(eq(user.email, email))
      .returning();
    return updatedUser || null;
  } catch (error) {
    return null;
  }
}


export async function getSavingsGoals(userId: string): Promise<Array<SavingsGoal>> {
  if (!db) return mockDb.getSavingsGoals(userId) as any;
  try {
    return await db.select().from(savingsGoal).where(eq(savingsGoal.userId, userId));
  } catch (error) {
    return [];
  }
}

export async function createSavingsGoal(
  userId: string,
  data: {
    title: string;
    targetAmount: string;
    targetDate: Date;
    currentAmount?: string;
    vaultAddress?: string;
    vaultPrivateKey?: string;
  }
): Promise<SavingsGoal | null> {
  if (!db) {
    return mockDb.createSavingsGoal(userId, {
      title: data.title,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate.toISOString(),
      currentAmount: data.currentAmount,
      vaultAddress: data.vaultAddress,
      vaultPrivateKey: data.vaultPrivateKey,
    }) as any;
  }
  try {
    const userObj = await getUserById(userId);
    const walletAddress = userObj?.walletAddress || null;

    const [created] = await db
      .insert(savingsGoal)
      .values({
        userId,
        title: data.title,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || "0",
        targetDate: data.targetDate,
        vaultAddress: data.vaultAddress,
        vaultPrivateKey: data.vaultPrivateKey,
        walletAddress,
      })
      .returning();
    return created || null;
  } catch (error) {
    return null;
  }
}

export async function updateSavingsGoal(
  id: string,
  data: Partial<{ title: string; targetAmount: string; currentAmount: string; targetDate: Date }>
): Promise<SavingsGoal | null> {
  if (!db) {
    return mockDb.updateSavingsGoal(id, {
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      targetDate: data.targetDate?.toISOString(),
    }) as any;
  }
  try {
    const [updated] = await db
      .update(savingsGoal)
      .set(data)
      .where(eq(savingsGoal.id, id))
      .returning();
    return updated || null;
  } catch (error) {
    return null;
  }
}

export async function deleteSavingsGoal(id: string): Promise<{ id: string } | null> {
  if (!db) return mockDb.deleteSavingsGoal(id);
  try {
    await db.delete(savingsGoal).where(eq(savingsGoal.id, id));
    return { id };
  } catch (error) {
    return null;
  }
}

export async function getBills(userId: string): Promise<Array<Bill>> {
  if (!db) return mockDb.getBills(userId) as any;
  try {
    return await db.select().from(bill).where(eq(bill.userId, userId));
  } catch (error) {
    return [];
  }
}

export async function createBill(
  userId: string,
  data: { title: string; amount: string; dueDate: Date; frequency?: string }
): Promise<Bill | null> {
  if (!db) {
    return mockDb.createBill(userId, {
      title: data.title,
      amount: data.amount,
      dueDate: data.dueDate.toISOString(),
      frequency: data.frequency,
    }) as any;
  }
  try {
    const userObj = await getUserById(userId);
    const walletAddress = userObj?.walletAddress || null;

    const [created] = await db
      .insert(bill)
      .values({
        userId,
        title: data.title,
        amount: data.amount,
        dueDate: data.dueDate,
        frequency: data.frequency || "monthly",
        walletAddress,
      })
      .returning();
    return created || null;
  } catch (error) {
    return null;
  }
}

export async function updateBill(
  id: string,
  data: Partial<{ title: string; amount: string; dueDate: Date; frequency: string; isPaid: boolean }>
): Promise<Bill | null> {
  if (!db) {
    return mockDb.updateBill(id, {
      title: data.title,
      amount: data.amount,
      dueDate: data.dueDate?.toISOString(),
      frequency: data.frequency,
      isPaid: data.isPaid,
    }) as any;
  }
  try {
    const [updated] = await db.update(bill).set(data).where(eq(bill.id, id)).returning();
    return updated || null;
  } catch (error) {
    return null;
  }
}

export async function deleteBill(id: string): Promise<{ id: string } | null> {
  if (!db) return mockDb.deleteBill(id);
  try {
    await db.delete(bill).where(eq(bill.id, id));
    return { id };
  } catch (error) {
    return null;
  }
}

export async function getTransactions(userId: string): Promise<Array<Transaction>> {
  if (!db) return mockDb.getTransactions(userId) as any;
  try {
    return await db
      .select()
      .from(transaction)
      .where(eq(transaction.userId, userId))
      .orderBy(desc(transaction.createdAt));
  } catch (error) {
    return [];
  }
}

export async function createTransaction(
  userId: string,
  data: { type: string; amount: string; token?: string; status?: string; txHash?: string; description?: string }
): Promise<Transaction | null> {
  if (!db) return mockDb.createTransaction(userId, data) as any;
  try {
    const [created] = await db
      .insert(transaction)
      .values({
        userId,
        type: data.type,
        amount: data.amount,
        token: data.token || "cUSD",
        status: data.status || "completed",
        txHash: data.txHash || null,
        description: data.description || null,
      })
      .returning();
    return created || null;
  } catch (error) {
    return null;
  }
}

export async function createOTP(email: string, otp: string, purpose: string): Promise<OtpVerification | null> {
  if (!db) return mockDb.createOTP(email, otp, purpose) as any;
  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const [created] = await db
      .insert(otpVerification)
      .values({
        email,
        otp,
        purpose,
        expiresAt,
      })
      .returning();
    return created || null;
  } catch (error) {
    return null;
  }
}

export async function verifyOTP(email: string, otp: string, purpose: string): Promise<boolean> {
  if (!db) return mockDb.verifyOTP(email, otp, purpose);
  try {
    const [verified] = await db
      .update(otpVerification)
      .set({ isVerified: true })
      .where(
        and(
          eq(otpVerification.email, email),
          eq(otpVerification.otp, otp),
          eq(otpVerification.purpose, purpose),
          eq(otpVerification.isVerified, false),
          gt(otpVerification.expiresAt, new Date())
        )
      )
      .returning();
    return !!verified;
  } catch (error) {
    return false;
  }
}

/**
 * Persists the latest on-chain balance snapshot (cUSD, USDC, CELO) to the User row.
 * Called by /api/paycon/balance every time a balance is fetched.
 */
export async function updateUserBalance(
  userId: string,
  balances: { cUSD: number; usdc: number; celo: number }
): Promise<void> {
  if (!db) {
    mockDb.updateUserBalance(userId, balances);
    return;
  }
  try {
    await db
      .update(user)
      .set({
        balanceCUSD: String(balances.cUSD),
        balanceUSDC: String(balances.usdc),
        balanceCELO: String(balances.celo),
        balanceUpdatedAt: new Date(),
      } as any)
      .where(eq(user.id, userId));
  } catch (error) {
    console.warn("updateUserBalance failed:", error);
  }
}

/**
 * Saves an on-chain transaction to the DB only if it does not already exist
 * (deduplication by txHash + userId). This keeps the DB in sync with Blockscout.
 */
export async function upsertOnChainTransaction(
  userId: string,
  data: {
    txHash: string;
    type: string;
    amount: string;
    token: string;
    status: string;
    description: string;
    createdAt: string;
  }
): Promise<void> {
  if (!db) {
    mockDb.upsertOnChainTransaction(userId, data);
    return;
  }
  try {
    // Check if this txHash is already stored for this user
    const existing = await db
      .select({ id: transaction.id })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, userId),
          eq(transaction.txHash as any, data.txHash)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(transaction).values({
        userId,
        type: data.type,
        amount: data.amount,
        token: data.token,
        status: data.status,
        txHash: data.txHash,
        description: data.description,
        createdAt: new Date(data.createdAt),
      } as any);
    }
  } catch (error) {
    console.warn("upsertOnChainTransaction failed:", error);
  }
}


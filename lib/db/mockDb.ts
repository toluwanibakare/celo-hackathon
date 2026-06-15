import fs from "node:fs";
import path from "node:path";

const MOCK_DB_PATH = path.join(process.cwd(), "db.json");

interface MockDbSchema {
  users: any[];
  chats: any[];
  messages: any[];
  documents: any[];
  suggestions: any[];
  streams: any[];
  savingsGoals: any[];
  bills: any[];
  transactions: any[];
  otpVerifications: any[];
}

function initMockDb(): MockDbSchema {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    const defaultDb: MockDbSchema = {
      users: [],
      chats: [],
      messages: [],
      documents: [],
      suggestions: [],
      streams: [],
      savingsGoals: [],
      bills: [],
      transactions: [],
      otpVerifications: [],
    };
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(MOCK_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read mock db. Resetting.", error);
    const defaultDb: MockDbSchema = {
      users: [],
      chats: [],
      messages: [],
      documents: [],
      suggestions: [],
      streams: [],
      savingsGoals: [],
      bills: [],
      transactions: [],
      otpVerifications: [],
    };
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
}

function saveMockDb(data: MockDbSchema) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

export const mockDb = {
  // --- USER QUERIES ---
  getUser: (email: string) => {
    const db = initMockDb();
    return db.users.filter((u) => u.email?.toLowerCase() === email.toLowerCase());
  },

  getUserByPhone: (phone: string) => {
    const db = initMockDb();
    return db.users.find((u) => u.phoneNumber === phone) || null;
  },

  getUserById: (id: string) => {
    const db = initMockDb();
    return db.users.find((u) => u.id === id) || null;
  },

  createUser: (email: string, passwordHash: string, phoneNumber?: string, walletAddress?: string, walletPrivateKey?: string) => {
    const db = initMockDb();
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password: passwordHash,
      walletAddress: walletAddress || null,
      phoneNumber: phoneNumber || null,
      walletPrivateKey: walletPrivateKey || null,
    };
    db.users.push(newUser);
    saveMockDb(db);
    return [newUser];
  },

  updateUserWallet: (userId: string, address: string, privateKey: string) => {
    const db = initMockDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.walletAddress = address;
      user.walletPrivateKey = privateKey;
      saveMockDb(db);
    }
    return user || null;
  },

  updateUserPassword: (email: string, passwordHash: string) => {
    const db = initMockDb();
    const user = db.users.find((u) => u.email === email);
    if (user) {
      user.password = passwordHash;
      saveMockDb(db);
    }
    return user || null;
  },

  updateUserBalance: (userId: string, balances: { cUSD: number; usdc: number; celo: number }) => {
    const db = initMockDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.balanceCUSD = String(balances.cUSD);
      user.balanceUSDC = String(balances.usdc);
      user.balanceCELO = String(balances.celo);
      user.balanceUpdatedAt = new Date().toISOString();
      saveMockDb(db);
    }
    return user || null;
  },

  upsertOnChainTransaction: (userId: string, data: { txHash: string; type: string; amount: string; token: string; status: string; description: string; createdAt: string }) => {
    const db = initMockDb();
    // Deduplicate by txHash + userId
    const existing = db.transactions.find(
      (t) => t.txHash === data.txHash && t.userId === userId
    );
    if (existing) return existing;
    const newTx = {
      id: crypto.randomUUID(),
      userId,
      type: data.type,
      amount: data.amount,
      token: data.token,
      status: data.status,
      txHash: data.txHash,
      description: data.description,
      createdAt: data.createdAt,
    };
    db.transactions.push(newTx);
    saveMockDb(db);
    return newTx;
  },

  getOrCreateUserByWalletAddress: (walletAddress: string) => {
    const db = initMockDb();
    let user = db.users.find((u) => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase());
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email: `${walletAddress.toLowerCase()}@local`,
        password: "",
        walletAddress: walletAddress,
        phoneNumber: null,
        walletPrivateKey: null,
      };
      db.users.push(user);
      saveMockDb(db);
    }
    return user;
  },

  getOrCreatePublicUser: () => {
    const db = initMockDb();
    const PUBLIC_USER_ID = "11111111-1111-1111-1111-111111111111";
    let user = db.users.find((u) => u.id === PUBLIC_USER_ID);
    if (!user) {
      user = {
        id: PUBLIC_USER_ID,
        email: "public@local",
        password: "",
        walletAddress: null,
        phoneNumber: null,
        walletPrivateKey: null,
      };
      db.users.push(user);
      saveMockDb(db);
    }
    return user;
  },

  // --- CHAT QUERIES ---
  getChatsByWalletAddress: (walletAddress: string, limit: number) => {
    const db = initMockDb();
    const user = db.users.find((u) => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase());
    if (!user) return [];
    return db.chats
      .filter((c) => c.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  getChatById: (id: string) => {
    const db = initMockDb();
    return db.chats.find((c) => c.id === id) || null;
  },

  saveChat: (chat: { id: string; userId: string; title: string; visibility: string }) => {
    const db = initMockDb();
    const existing = db.chats.find((c) => c.id === chat.id);
    if (!existing) {
      db.chats.push({
        ...chat,
        createdAt: new Date().toISOString(),
      });
      saveMockDb(db);
    }
  },

  deleteChatById: (id: string) => {
    const db = initMockDb();
    db.chats = db.chats.filter((c) => c.id !== id);
    db.messages = db.messages.filter((m) => m.chatId !== id);
    saveMockDb(db);
    return { id };
  },

  reassignChatToUser: (chatId: string, userId: string) => {
    const db = initMockDb();
    const chat = db.chats.find((c) => c.id === chatId);
    if (chat) {
      chat.userId = userId;
      saveMockDb(db);
    }
  },

  // --- MESSAGE QUERIES ---
  getMessagesByChatId: (chatId: string) => {
    const db = initMockDb();
    return db.messages.filter((m) => m.chatId === chatId);
  },

  saveMessages: (messages: any[]) => {
    const db = initMockDb();
    for (const msg of messages) {
      const existingIdx = db.messages.findIndex((m) => m.id === msg.id);
      const formattedMsg = {
        ...msg,
        createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt || new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        db.messages[existingIdx] = formattedMsg;
      } else {
        db.messages.push(formattedMsg);
      }
    }
    saveMockDb(db);
  },

  getMessageCountByUserId: (id: string, differenceInHours: number) => {
    const db = initMockDb();
    const cutoff = Date.now() - differenceInHours * 60 * 60 * 1000;
    const userChats = db.chats.filter((c) => c.userId === id).map((c) => c.id);
    const count = db.messages.filter(
      (m) => userChats.includes(m.chatId) && new Date(m.createdAt).getTime() >= cutoff && m.role === "user"
    ).length;
    return count;
  },

  // --- STREAM QUERIES ---
  createStreamId: (streamId: string, chatId: string) => {
    const db = initMockDb();
    db.streams.push({ id: streamId, chatId, createdAt: new Date().toISOString() });
    saveMockDb(db);
  },

  getStreamIdsByChatId: (chatId: string) => {
    const db = initMockDb();
    return db.streams.filter((s) => s.chatId === chatId).map((s) => s.id);
  },

  // --- PAYCON SAVINGS GOALS ---
  getSavingsGoals: (userId: string) => {
    const db = initMockDb();
    return db.savingsGoals.filter((g) => g.userId === userId);
  },

  createSavingsGoal: (userId: string, data: { title: string; targetAmount: string; targetDate: string; currentAmount?: string; vaultAddress?: string; vaultPrivateKey?: string }) => {
    const db = initMockDb();
    const newGoal = {
      id: crypto.randomUUID(),
      userId,
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || "0",
      targetDate: data.targetDate,
      vaultAddress: data.vaultAddress || null,
      vaultPrivateKey: data.vaultPrivateKey || null,
      createdAt: new Date().toISOString(),
    };
    db.savingsGoals.push(newGoal);
    saveMockDb(db);
    return newGoal;
  },

  updateSavingsGoal: (id: string, data: Partial<{ title: string; targetAmount: string; currentAmount: string; targetDate: string }>) => {
    const db = initMockDb();
    const goal = db.savingsGoals.find((g) => g.id === id);
    if (goal) {
      Object.assign(goal, data);
      saveMockDb(db);
    }
    return goal || null;
  },

  deleteSavingsGoal: (id: string) => {
    const db = initMockDb();
    db.savingsGoals = db.savingsGoals.filter((g) => g.id !== id);
    saveMockDb(db);
    return { id };
  },

  // --- PAYCON BILLS ---
  getBills: (userId: string) => {
    const db = initMockDb();
    return db.bills.filter((b) => b.userId === userId);
  },

  createBill: (userId: string, data: { title: string; amount: string; dueDate: string; frequency?: string }) => {
    const db = initMockDb();
    const newBill = {
      id: crypto.randomUUID(),
      userId,
      title: data.title,
      amount: data.amount,
      dueDate: data.dueDate,
      frequency: data.frequency || "monthly",
      isPaid: false,
      createdAt: new Date().toISOString(),
    };
    db.bills.push(newBill);
    saveMockDb(db);
    return newBill;
  },

  updateBill: (id: string, data: Partial<{ title: string; amount: string; dueDate: string; frequency: string; isPaid: boolean }>) => {
    const db = initMockDb();
    const bill = db.bills.find((b) => b.id === id);
    if (bill) {
      Object.assign(bill, data);
      saveMockDb(db);
    }
    return bill || null;
  },

  deleteBill: (id: string) => {
    const db = initMockDb();
    db.bills = db.bills.filter((b) => b.id !== id);
    saveMockDb(db);
    return { id };
  },

  // --- PAYCON TRANSACTIONS ---
  getTransactions: (userId: string) => {
    const db = initMockDb();
    return db.transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createTransaction: (userId: string, data: { type: string; amount: string; token?: string; status?: string; txHash?: string; description?: string }) => {
    const db = initMockDb();
    const newTx = {
      id: crypto.randomUUID(),
      userId,
      type: data.type, // 'deposit', 'withdrawal', 'bill_payment', 'savings_contribution'
      amount: data.amount,
      token: data.token || "cUSD",
      status: data.status || "completed",
      txHash: data.txHash || null,
      description: data.description || null,
      createdAt: new Date().toISOString(),
    };
    db.transactions.push(newTx);
    saveMockDb(db);
    return newTx;
  },

  // --- PAYCON OTP VERIFICATION ---
  createOTP: (email: string, otp: string, purpose: string) => {
    const db = initMockDb();
    const newOtp = {
      id: crypto.randomUUID(),
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes expiry
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    db.otpVerifications.push(newOtp);
    saveMockDb(db);
    return newOtp;
  },

  verifyOTP: (email: string, otp: string, purpose: string) => {
    const db = initMockDb();
    const found = db.otpVerifications.find(
      (v) =>
        v.email.toLowerCase() === email.toLowerCase() &&
        v.otp === otp &&
        v.purpose === purpose &&
        !v.isVerified &&
        new Date(v.expiresAt).getTime() > Date.now()
    );
    if (found) {
      found.isVerified = true;
      saveMockDb(db);
      return true;
    }
    return false;
  },
};

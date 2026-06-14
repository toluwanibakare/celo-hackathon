import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { myProvider, DEFAULT_ALIAS_CHAT_MODEL_ID } from "@/lib/ai/providers";
import { payconTools } from "@/lib/ai/tools/paycon-tools";
import { saveMessages, getMessagesByChatId, saveChat, getChatById } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    const selectedChatModel = body.selectedChatModel;
    let message = body.message;
    
    if (!message && body.messages) {
      message = body.messages[body.messages.length - 1];
    }

    if (!id || !message) {
      return new Response(JSON.stringify({ error: "Missing id or message" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Resolve user session
    const session = await auth();
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Check if chat exists, if not create one
    const chat = await getChatById({ id });
    if (!chat) {
      await saveChat({
        id,
        userId: session.user.id,
        title: message.content || "Financial Coaching Session",
        visibility: "private",
      });
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...messagesFromDb, message];

    // Save user message to DB
    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts || [{ type: "text", text: message.content }],
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const chosenModelId = selectedChatModel || DEFAULT_ALIAS_CHAT_MODEL_ID;

    const systemPrompt = `You are Paycon's AI Financial Coach. Your job is to help users manage their money, save towards goals, and pay bills on the Celo blockchain.
You have access to tools to fetch the user's wallet details, savings goals, and bills, as well as tools to pay bills, create savings goals, and contribute to savings.

When the user asks 'Can I afford X' or similar budgeting questions:
1. Always call 'getWalletDetails', 'getSavingsGoals', and 'getBills' first to understand the user's current situation.
2. Sum their upcoming bills and subtract them from their total balance.
3. Check how much they need for their active savings goals.
4. Calculate a safe spending limit and give a clear, friendly, and practical answer. E.g. "Your current balance is $150. You have $40 in upcoming bills and a $50 target for your savings goal, leaving you with $60 of flexible money. Yes, you can afford to spend $40 today, but it will leave you with $20 for other discretionary expenses."

Be encouraging, supportive, and clear. Avoid overly technical blockchain jargon. Use 'digital dollars' or 'stablecoins' instead of raw crypto terms when possible.`;

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel(chosenModelId),
          system: systemPrompt,
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools: [
            "getWalletDetails",
            "getSavingsGoals",
            "getBills",
            "createSavingsGoal",
            "contributeToSavings",
            "payBill",
          ],
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: payconTools({ session }),
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: (err) => {
        console.error("AI Coach Stream Error:", err);
        return "Oops, an error occurred in the financial coach service!";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error: any) {
    console.error("Chat route error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

import { auth } from "@/app/(auth)/auth";
import { getUserById } from "@/lib/db/queries";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Resolve user session
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Fetch user details from DB
    const dbUser = await getUserById(session.user.id);
    if (!dbUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Connect to the n8n webhook
    const n8nWebhookUrl = "https://ennyty27.app.n8n.cloud/webhook/paycon";

    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        userId: dbUser.id,
        email: dbUser.email || "",
        phoneNumber: dbUser.phoneNumber || "",
        walletAddress: dbUser.walletAddress || "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n webhook error response:", errorText);
      return new Response(
        JSON.stringify({ error: `n8n webhook error: ${response.statusText}` }),
        {
          status: response.status,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const responseText = await response.text();
    let reply = responseText;
    
    // Attempt to parse JSON response if any
    try {
      const parsed = JSON.parse(responseText);
      reply = parsed.output || parsed.response || parsed.message || parsed.text || responseText;
      if (typeof reply === "object") {
        reply = JSON.stringify(reply);
      }
    } catch (e) {
      // If it's not JSON, we keep the raw text response
    }

    return new Response(JSON.stringify({ response: reply }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error: any) {
    console.error("n8n-chat API route error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

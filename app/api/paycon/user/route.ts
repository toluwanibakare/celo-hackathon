import { NextResponse } from "next/server";
import { getUserByPhone, getUserById, getUser } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  try {
    let userData = null;

    if (phone) {
      userData = await getUserByPhone(phone);
    } else if (id) {
      userData = await getUserById(id);
    } else if (email) {
      const users = await getUser(email);
      if (users.length > 0) {
        userData = users[0];
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user details. Include private key for backend/n8n integration to allow signing txs.
    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      walletAddress: userData.walletAddress,
      walletPrivateKey: userData.walletPrivateKey,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

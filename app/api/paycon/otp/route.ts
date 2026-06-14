import { NextResponse } from "next/server";
import { createOTP, verifyOTP } from "@/lib/db/queries";

// POST /api/paycon/otp
export async function POST(request: Request) {
  try {
    const { email, otp, purpose, action } = await request.json();

    if (action === "verify") {
      if (!email || !otp || !purpose) {
        return NextResponse.json({ error: "Missing email, otp, or purpose" }, { status: 400 });
      }
      const success = await verifyOTP(email, otp, purpose);
      if (success) {
        return NextResponse.json({ success: true, message: "OTP verified successfully" });
      } else {
        return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 });
      }
    } else {
      // Default action: generate OTP
      if (!email || !purpose) {
        return NextResponse.json({ error: "Missing email or purpose" }, { status: 400 });
      }

      // Generate a random 6 digit number
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await createOTP(email, code, purpose);

      // Log the OTP for development/testing
      console.log(`[OTP SERVICE] Generated OTP ${code} for ${email} (Purpose: ${purpose})`);

      // In a real app, you would send this via email/SMS.
      // For the demo, we return it in the response so the frontend/WhatsApp bot can access it easily.
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully (Simulated)",
        otp: code, // Return it for easy testing
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createOTP, verifyOTP } from "@/lib/db/queries";
import { sendOTPEmail } from "@/lib/email";

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

      // Generate a random 4 digit number
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      await createOTP(email, code, purpose);

      // Send the OTP via Gmail SMTP
      await sendOTPEmail(email, code, purpose);

      // Log the OTP for development/testing
      console.log(`[OTP SERVICE] Generated and sent OTP ${code} to ${email} (Purpose: ${purpose})`);

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully via email",
        otp: code, // Return it for easy testing/fallback
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

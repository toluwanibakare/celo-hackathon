import nodemailer from "nodemailer";

// Create reusable transporter object using the SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const SENDER_IDENTITY = `"Paycon" <${process.env.SMTP_USER}>`;

/**
 * Sends an OTP verification email to the user.
 */
export async function sendOTPEmail(email: string, otp: string, purpose: string) {
  const mailOptions = {
    from: SENDER_IDENTITY,
    to: email,
    subject: `🔐 Verify your secure action - Paycon OTP`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #FAF8F5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #102a1e; margin: 0; font-size: 28px; font-weight: 900;">Paycon</h1>
          <p style="color: #2CA867; font-size: 12px; text-transform: uppercase; font-weight: bold; margin: 4px 0 0 0;">Fintech Stablecoin Savings</p>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e6e1da;">
          <h2 style="color: #102a1e; font-size: 18px; margin-top: 0;">Confirm Your Request</h2>
          <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">You requested verification for: <strong>${purpose}</strong>. Use the secure authorization code below to complete this action:</p>
          <div style="background-color: #FAF8F5; border: 2px dashed #FBCC5C; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; color: #102a1e; letter-spacing: 4px;">${otp}</span>
          </div>
          <p style="color: #718096; font-size: 12px; line-height: 1.5; margin-bottom: 0;">This code is only valid for 10 minutes. If you did not request this verification, please ignore this email or secure your account.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 11px;">
          <p>&copy; ${new Date().getFullYear()} Paycon. Deployed on Celo Sepolia Testnet.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] OTP email sent successfully to ${email}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL SERVICE] Failed to send OTP email to ${email}:`, error);
    return false;
  }
}

interface ReceiptDetails {
  type: string;
  amount: string;
  token: string;
  txHash: string;
  description: string;
}

/**
 * Sends a transaction receipt email to the user.
 */
export async function sendReceiptEmail(email: string, details: ReceiptDetails) {
  const isCUSD = details.token === "cUSD";
  const explorerUrl = `https://sepolia.celoscan.io/tx/${details.txHash}`;
  const typeLabel = details.type === "bill_payment" ? "Bill Payment" : "Savings Goal Contribution";

  const mailOptions = {
    from: SENDER_IDENTITY,
    to: email,
    subject: `🧾 Transaction Receipt - Celo Sepolia`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #FAF8F5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #102a1e; margin: 0; font-size: 28px; font-weight: 900;">Paycon</h1>
          <p style="color: #2CA867; font-size: 12px; text-transform: uppercase; font-weight: bold; margin: 4px 0 0 0;">Transaction Receipt</p>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e6e1da;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 12px; text-transform: uppercase; font-weight: bold; color: #718096;">Amount Transacted</span>
            <h2 style="font-size: 36px; font-weight: 900; color: ${isCUSD ? "#2CA867" : "#3182ce"}; margin: 4px 0 0 0;">
              ${details.amount} ${details.token}
            </h2>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px 0; color: #718096;">Transaction Type</td>
              <td style="padding: 10px 0; text-align: right; color: #102a1e; font-weight: bold;">${typeLabel}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px 0; color: #718096;">Description</td>
              <td style="padding: 10px 0; text-align: right; color: #102a1e; font-weight: bold;">${details.description}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px 0; color: #718096;">Blockchain Network</td>
              <td style="padding: 10px 0; text-align: right; color: #102a1e; font-weight: bold;">Celo Sepolia</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #718096;">Transaction Hash</td>
              <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 11px;">
                <a href="${explorerUrl}" target="_blank" style="color: #2CA867; text-decoration: none;">${details.txHash.substring(0, 10)}...${details.txHash.substring(details.txHash.length - 8)}</a>
              </td>
            </tr>
          </table>
          <div style="text-align: center;">
            <a href="${explorerUrl}" target="_blank" style="background-color: #102a1e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">View on Celoscan</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 11px;">
          <p>&copy; ${new Date().getFullYear()} Paycon. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Receipt email sent successfully to ${email}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL SERVICE] Failed to send receipt email to ${email}:`, error);
    return false;
  }
}

"use client";

import React, { useState, useTransition } from "react";
import { X, Eye, EyeOff, Check, Loader2, Mail, Lock, KeyRound } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "./toast";
import { resetPassword } from "@/app/(auth)/actions";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [stage, setStage] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, startResetTransition] = useTransition();

  if (!isOpen) return null;

  // Password strength checks (Stage 2 requirements)
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/paycon/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          purpose: "reset_password",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          type: "success",
          description: "Verification code sent to your email!",
        });
        setStage(2);
      } else {
        toast({
          type: "error",
          description: data.error || "Failed to send verification code. Please try again.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !password || !confirmPassword) {
      toast({
        type: "error",
        description: "All fields are required.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        type: "error",
        description: "Passwords do not match.",
      });
      return;
    }

    if (!hasMinLength || !hasNumber || !hasSpecial) {
      toast({
        type: "error",
        description: "Password does not meet all security requirements.",
      });
      return;
    }

    startResetTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("email", email.trim());
        formData.append("otp", otp.trim());
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);

        const result = await resetPassword({ status: "idle" }, formData);

        if (result.status === "success") {
          toast({
            type: "success",
            description: "Password reset successfully! You can now log in.",
          });
          // Reset local states and close modal
          setStage(1);
          setEmail("");
          setOtp("");
          setPassword("");
          setConfirmPassword("");
          onClose();
        } else {
          toast({
            type: "error",
            description: result.error || "Failed to reset password. Please check your OTP.",
          });
        }
      } catch (err: any) {
        toast({
          type: "error",
          description: err.message || "An unexpected error occurred.",
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Premium Fintech Glow inside the Modal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 border-t-4 border-t-yellow-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition focus:outline-none"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-blue-400 to-yellow-300 bg-clip-text text-transparent">
            {stage === 1 ? "Reset Password" : "Verify & Reset"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {stage === 1 
              ? "Enter your email address to receive a 4-digit verification code." 
              : `Enter the code sent to ${email} and set your new password.`}
          </p>
        </div>

        {stage === 1 ? (
          /* STAGE 1 FORM: Send OTP */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-email" className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  className="bg-slate-900 border-slate-800 text-slate-100 text-sm h-11 pl-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSendingOtp}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl transition flex items-center justify-center gap-2 mt-2"
            >
              {isSendingOtp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>
        ) : (
          /* STAGE 2 FORM: Enter OTP & New Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* OTP Verification Code */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-otp" className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                4-Digit Verification Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="reset-otp"
                  type="text"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="0000"
                  className="bg-slate-900 border-slate-800 text-slate-100 text-sm h-11 pl-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl w-full font-mono tracking-[0.5em] text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password" className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  className="bg-slate-900 border-slate-800 text-slate-100 text-sm h-11 pl-10 pr-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-5 w-5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password" className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="bg-slate-900 border-slate-800 text-slate-100 text-sm h-11 pl-10 pr-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl w-full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-5 w-5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Security Rules Checklist */}
            {password.length > 0 && (
              <div className="text-xs space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  Security Requirements:
                </p>
                <div className="flex items-center gap-2 text-slate-400">
                  {hasMinLength ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0 mx-1" />
                  )}
                  <span className={hasMinLength ? "text-slate-300 font-medium" : ""}>
                    At least 6 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  {hasNumber ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0 mx-1" />
                  )}
                  <span className={hasNumber ? "text-slate-300 font-medium" : ""}>
                    At least 1 digit (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  {hasSpecial ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0 mx-1" />
                  )}
                  <span className={hasSpecial ? "text-slate-300 font-medium" : ""}>
                    At least 1 symbol (e.g. !, @, #)
                  </span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isResetting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl transition flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              
              <div className="flex justify-between items-center text-xs mt-1 px-1">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="text-slate-400 hover:text-emerald-400 transition focus:outline-none"
                >
                  {isSendingOtp ? "Sending..." : "Resend Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="text-slate-400 hover:text-emerald-400 transition focus:outline-none"
                >
                  Change Email
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import Form from 'next/form';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Check, Globe } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

const COUNTRIES = [
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
];

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  showPhoneNumber = false,
  showStrengthRules = false,
  showForgotPassword = false,
  onForgotPasswordClick,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  showPhoneNumber?: boolean;
  showStrengthRules?: boolean;
  showForgotPassword?: boolean;
  onForgotPasswordClick?: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [phoneBody, setPhoneBody] = useState('');

  // Password strength checks
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    <Form action={action} className="flex flex-col gap-5 px-4 sm:px-16">
      {/* EMAIL ADDRESS */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-slate-400 font-semibold text-xs uppercase tracking-wider"
        >
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          className="bg-slate-900 border-slate-800 text-slate-100 text-sm h-11 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      {/* PHONE NUMBER FIELD WITH COUNTRY CODE */}
      {showPhoneNumber && (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="phoneInput"
            className="text-slate-400 font-semibold text-xs uppercase tracking-wider"
          >
            WhatsApp Phone Number
          </Label>
          <div className="flex gap-2">
            <div className="relative shrink-0">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 text-slate-100 text-sm h-11 px-3 pr-8 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={`${c.code}-${c.name}`} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-2.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
            <Input
              id="phoneInput"
              type="tel"
              placeholder="8012345678"
              value={phoneBody}
              onChange={(e) => setPhoneBody(e.target.value.replace(/\D/g, ''))}
              className="bg-slate-900 border-slate-800 text-slate-100 text-sm h-11 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl flex-1"
              required
            />
          </div>
          {/* Hidden input to combine countryCode and phoneBody for the action */}
          <input
            type="hidden"
            name="phoneNumber"
            value={`${countryCode}${phoneBody}`}
          />
          <p className="text-[10px] text-slate-500">
            Enter your mobile number without the leading zero (e.g. 8012345678).
          </p>
        </div>
      )}

      {/* PASSWORD FIELD WITH VISIBILITY TOGGLE */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <Label
            htmlFor="password"
            className="text-slate-400 font-semibold text-xs uppercase tracking-wider"
          >
            Password
          </Label>
          {showForgotPassword && (
            onForgotPasswordClick ? (
              <button
                type="button"
                onClick={onForgotPasswordClick}
                className="text-emerald-400 hover:text-emerald-300 transition text-xs font-semibold focus:outline-none"
              >
                Forgot password?
              </button>
            ) : (
              <Link
                href="/forgot-password"
                className="text-emerald-400 hover:text-emerald-300 transition text-xs font-semibold"
              >
                Forgot password?
              </Link>
            )
          )}
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            className="bg-slate-900 border-slate-800 text-slate-100 text-sm h-11 pr-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 h-5 w-5 text-slate-400 hover:text-slate-200 transition"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* DYNAMIC PASSWORD STRENGTH RULES */}
      {showStrengthRules && password.length > 0 && (
        <div className="text-xs space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-900">
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">
            Security Requirements:
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            {hasMinLength ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0 mx-1" />
            )}
            <span className={hasMinLength ? 'text-slate-300 font-medium' : ''}>
              At least 6 characters
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            {hasNumber ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0 mx-1" />
            )}
            <span className={hasNumber ? 'text-slate-300 font-medium' : ''}>
              At least 1 digit (0-9)
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            {hasSpecial ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0 mx-1" />
            )}
            <span className={hasSpecial ? 'text-slate-300 font-medium' : ''}>
              At least 1 symbol (e.g. !, @, #)
            </span>
          </div>
        </div>
      )}

      {children}
    </Form>
  );
}

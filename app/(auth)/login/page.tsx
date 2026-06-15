'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { ForgotPasswordModal } from '@/components/forgot-password-modal';

import { login, type LoginActionState } from '../actions';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const updateSession: any = () => {};

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: state.error || 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: state.error || 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      (updateSession as any)();
      router.push('/dashboard');
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 p-4 py-12 relative overflow-hidden">

      {/* === Animated ambient orbs === */}
      <div className="ambient-orbs">
        <div
          className="orb orb-green animate-orb-1"
          style={{ width: 520, height: 520, top: '-10%', left: '-5%', opacity: 0.07 }}
        />
        <div
          className="orb orb-gold animate-orb-2"
          style={{ width: 400, height: 400, bottom: '-5%', right: '-5%', opacity: 0.06 }}
        />
        <div
          className="orb orb-blue animate-orb-1"
          style={{ width: 300, height: 300, top: '55%', left: '55%', opacity: 0.04, animationDelay: '4s' }}
        />
      </div>

      {/* === Animated card === */}
      <div className="animate-slide-up-card w-full max-w-md relative z-10">
        <div className="glass-card rounded-3xl p-8 border-t-4 border-t-yellow-500/80 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">

          {/* Subtle inner shine */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

          {/* Brand logo & header */}
          <div className="flex flex-col items-center gap-3 text-center mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              {/* Gold glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 blur-xl animate-gold-glow" />
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-yellow-400/30 bg-yellow-500/10 flex items-center justify-center p-0.5">
                <img src="/images/logo.png" alt="Paycon Logo" className="w-full h-full object-contain scale-110" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight gradient-text-green">
                Welcome back to Paycon
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                Sign in to manage your savings goals and bills
              </p>
              {/* Powered by badge */}
              <div className="flex justify-center mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/8 text-emerald-500/70">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Powered by Celo
                </span>
              </div>
            </div>
          </div>

          <AuthForm
            action={handleSubmit}
            defaultEmail={email}
            showForgotPassword={true}
            onForgotPasswordClick={() => setIsForgotPasswordOpen(true)}
          >
            <div className="pt-2">
              <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
            </div>
            <p className="text-center text-xs text-slate-400 mt-6 font-medium">
              {"Don't have an account? "}
              <Link
                href="/register"
                className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition"
              >
                Sign up
              </Link>
              {' for free.'}
            </p>
          </AuthForm>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}


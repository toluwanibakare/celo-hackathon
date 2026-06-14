'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  const updateSession: any = () => {};

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: 'Account created successfully!' });

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
    <div className="flex h-dvh w-screen items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
      {/* Premium Fintech Glow Background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 border-t-4 border-t-yellow-500 rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10">
        {/* Brand logo & header */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-yellow-400/20 bg-yellow-500 flex items-center justify-center p-1.5 shadow-yellow-500/10">
            <img src="/images/logo.png" alt="Paycon Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-blue-400 to-yellow-300 bg-clip-text text-transparent">
              Create your Paycon Account
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              AI-driven stablecoin savings and automated bill manager
            </p>
          </div>
        </div>

        <AuthForm
          action={handleSubmit}
          defaultEmail={email}
          showPhoneNumber={true}
          showStrengthRules={true}
        >
          <div className="pt-2">
            <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6 font-medium">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Role } from '@shared/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { loginFormSchema, type LoginFormValues } from '@/lib/validators/auth';
import { useAuth } from '@/hooks/useAuth';

const destinationByRole: Record<Role, string> = {
  [Role.STUDENT]: '/',
  [Role.TEACHER]: '/teacher',
  [Role.ADMIN]: '/admin',
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, setSession } = useAuth();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(destinationByRole[role], { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    setSubmissionError(null);

    try {
      const response = await api.post('/auth/login', values);
      setSession(response.data.data);
      navigate(destinationByRole[response.data.data.user.role as Role], { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        setSubmissionError(
          error.response?.data?.error?.message ?? 'Login failed. Check your credentials and try again.',
        );
        return;
      }

      setSubmissionError('Login failed. Check your credentials and try again.');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="glass-panel w-full space-y-5 p-8" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Player Login</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Start the next puzzle run.</h1>
          <p className="mt-2 text-sm text-slate-600">Students play, teachers monitor progress, admins manage the platform.</p>
        </div>
        {submissionError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submissionError}
          </div>
        ) : null}
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Email</span>
          <input
            {...register('email')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 outline-none focus:border-brand-400"
          />
          {errors.email ? <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span> : null}
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Password</span>
          <input
            type="password"
            {...register('password')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 outline-none focus:border-brand-400"
          />
          {errors.password ? (
            <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>
          ) : null}
        </label>
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Continue
        </Button>
        <p className="text-sm text-slate-600">
          Need an account? <Link to="/register" className="font-semibold text-brand-700">Register</Link>
        </p>
      </form>
    </div>
  );
};

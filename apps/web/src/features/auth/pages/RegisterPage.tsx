import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Role } from '@shared/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { registerFormSchema, type RegisterFormValues } from '@/lib/validators/auth';
import { useAuth } from '@/hooks/useAuth';

const destinationByRole: Record<Role, string> = {
  [Role.STUDENT]: '/',
  [Role.TEACHER]: '/teacher',
  [Role.ADMIN]: '/admin',
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: Role.STUDENT,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmissionError(null);

    try {
      const response = await api.post('/auth/register', values);
      setSession(response.data.data);
      navigate(destinationByRole[response.data.data.user.role as Role]);
    } catch (error) {
      if (error instanceof AxiosError) {
        setSubmissionError(
          error.response?.data?.error?.message ?? 'Registration failed. Check the form and try again.',
        );
        return;
      }

      setSubmissionError('Registration failed. Check the form and try again.');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="glass-panel w-full space-y-5 p-8" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">New Player</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Create a Code Cat account.</h1>
        </div>
        {submissionError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submissionError}
          </div>
        ) : null}
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Account Type</span>
          <select
            {...register('role')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 outline-none focus:border-brand-400"
          >
            <option value={Role.STUDENT}>Student</option>
            <option value={Role.TEACHER}>Teacher</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Username</span>
          <input
            {...register('username')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 outline-none focus:border-brand-400"
          />
          {errors.username ? (
            <span className="mt-1 block text-sm text-red-600">{errors.username.message}</span>
          ) : null}
        </label>
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
          Register
        </Button>
        <p className="text-sm text-slate-600">
          Have an account? <Link to="/login" className="font-semibold text-brand-700">Login</Link>
        </p>
      </form>
    </div>
  );
};

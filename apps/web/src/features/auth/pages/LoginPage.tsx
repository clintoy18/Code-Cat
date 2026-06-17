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
import codeCatLogo from '@/assets/codecat-logo.png';

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
    <div className="auth-shell">
      <div className="auth-shell__panel">
        <section className="auth-shell__hero">
          <img src={codeCatLogo} alt="Code Cat" className="auth-shell__logo" />
          <p className="auth-shell__eyebrow">Code Cat Access</p>
          <h1 className="auth-shell__title">Start the next puzzle run.</h1>
          <p className="auth-shell__copy">
            Students solve rooms, teachers monitor progress, and admins manage the curriculum through the same
            monochrome arcade system.
          </p>
        </section>

        <form className="auth-card" onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-card__header">
            <p className="auth-card__eyebrow">Player Login</p>
            <h2 className="auth-card__title">Sign in to continue.</h2>
            <p className="auth-card__body">Use your school account to resume the current mission.</p>
          </div>
        {submissionError ? (
          <div className="auth-alert auth-alert--error">{submissionError}</div>
        ) : null}
        <label className="auth-field">
          <span className="auth-field__label">Email</span>
          <input {...register('email')} className="auth-field__input" autoComplete="email" />
          {errors.email ? <span className="auth-field__error">{errors.email.message}</span> : null}
        </label>
        <label className="auth-field">
          <span className="auth-field__label">Password</span>
          <input
            type="password"
            {...register('password')}
            className="auth-field__input"
            autoComplete="current-password"
          />
          {errors.password ? <span className="auth-field__error">{errors.password.message}</span> : null}
        </label>
        <Button type="submit" className="pixel-button auth-card__submit w-full" size="lg" isLoading={isSubmitting}>
          Continue
        </Button>
        <p className="auth-card__footer">
          Need an account?{' '}
          <Link to="/register" className="auth-card__link">
            Register
          </Link>
        </p>
        </form>
      </div>
    </div>
  );
};

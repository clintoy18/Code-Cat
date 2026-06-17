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
import codeCatLogo from '@/assets/codecat-logo.png';

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
    <div className="auth-shell">
      <div className="auth-shell__panel">
        <section className="auth-shell__hero">
          <img src={codeCatLogo} alt="Code Cat" className="auth-shell__logo" />
          <p className="auth-shell__eyebrow">Code Cat Access</p>
          <h1 className="auth-shell__title">Create a Code Cat account.</h1>
          <p className="auth-shell__copy">
            Pick a classroom role, enter your details, and step into the puzzle map with the same monochrome arcade
            interface used across the rest of the game.
          </p>
        </section>

        <form className="auth-card" onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-card__header">
            <p className="auth-card__eyebrow">New Account</p>
            <h2 className="auth-card__title">Register a player or teacher account.</h2>
            <p className="auth-card__body">Admin accounts stay seeded separately and do not register from this page.</p>
          </div>
        {submissionError ? (
          <div className="auth-alert auth-alert--error">{submissionError}</div>
        ) : null}
        <label className="auth-field">
          <span className="auth-field__label">Account Type</span>
          <select {...register('role')} className="auth-field__input">
            <option value={Role.STUDENT}>Student</option>
            <option value={Role.TEACHER}>Teacher</option>
          </select>
        </label>
        <label className="auth-field">
          <span className="auth-field__label">Username</span>
          <input {...register('username')} className="auth-field__input" autoComplete="username" />
          {errors.username ? <span className="auth-field__error">{errors.username.message}</span> : null}
        </label>
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
            autoComplete="new-password"
          />
          {errors.password ? <span className="auth-field__error">{errors.password.message}</span> : null}
        </label>
        <Button type="submit" className="pixel-button auth-card__submit w-full" size="lg" isLoading={isSubmitting}>
          Register
        </Button>
        <p className="auth-card__footer">
          Have an account?{' '}
          <Link to="/login" className="auth-card__link">
            Login
          </Link>
        </p>
        </form>
      </div>
    </div>
  );
};

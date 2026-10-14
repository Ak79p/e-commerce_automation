import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { TextField } from '../components/FormField';
import { Alert } from '../components/StatusViews';
import { useAuth } from '../context/AuthContext';
import { useNotice } from '../context/NoticeContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { focusFirstError, useForm } from '../hooks/useForm';
import { safeRedirectPath } from '../lib/redirect';
import { PASSWORD_MIN_LENGTH, validateRegistration } from '../lib/validation';

export function RegisterPage() {
  useDocumentTitle('Create account');
  const { isAuthenticated, register } = useAuth();
  const { notify } = useNotice();
  const [params] = useSearchParams();
  const rawRedirect = params.get('redirect');
  const redirect = safeRedirectPath(rawRedirect);
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { field, validateAll, values, applyServerErrors } = useForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    validateRegistration,
  );

  if (isAuthenticated) return <Navigate to={redirect} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    if (!validateAll()) {
      focusFirstError(formRef.current);
      return;
    }
    setSubmitting(true);
    const result = await register(values);
    if (result.ok) {
      notify(`Account created. Welcome to ShopNest, ${result.data.name.split(' ')[0]}!`);
      return;
    }
    setSubmitting(false);
    applyServerErrors(result.error.fieldErrors);
    if (!result.error.fieldErrors) setFormError(result.error.message);
    else focusFirstError(formRef.current);
  };

  const loginHref = rawRedirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

  return (
    <div className="page auth-page" data-testid="register-page">
      <div className="auth-card">
        <h1 className="page__title">Create your account</h1>
        {formError && (
          <Alert tone="error" testId="signup-error">
            {formError}
          </Alert>
        )}
        <form ref={formRef} className="form" onSubmit={onSubmit} noValidate data-testid="signup-form" aria-label="Create account">
          <TextField id="signup-name" label="Full name" autoComplete="name" required {...field('name')} />
          <TextField id="signup-email" label="Email" type="email" autoComplete="email" required {...field('email')} />
          <TextField
            id="signup-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            required
            {...field('password')}
          />
          <TextField
            id="signup-confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            {...field('confirmPassword')}
          />
          <button type="submit" className="button button--primary button--block button--large" disabled={submitting} data-testid="signup-submit">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-card__switch">
          Already have an account?{' '}
          <Link to={loginHref} data-testid="go-to-login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

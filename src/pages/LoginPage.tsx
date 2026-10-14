import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { TextField } from '../components/FormField';
import { Alert } from '../components/StatusViews';
import { useAuth } from '../context/AuthContext';
import { useNotice } from '../context/NoticeContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { focusFirstError, useForm } from '../hooks/useForm';
import { safeRedirectPath } from '../lib/redirect';
import { validateLogin } from '../lib/validation';

export function LoginPage() {
  useDocumentTitle('Sign in');
  const { isAuthenticated, login } = useAuth();
  const { notify } = useNotice();
  const [params] = useSearchParams();
  const rawRedirect = params.get('redirect');
  const redirect = safeRedirectPath(rawRedirect);
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { field, validateAll, values, applyServerErrors } = useForm({ email: '', password: '' }, validateLogin);

  // Already signed in (or just signed in): continue to the requested page.
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
    const result = await login(values);
    if (result.ok) {
      notify(`Welcome back, ${result.data.name.split(' ')[0]}!`);
      return; // the re-render with isAuthenticated=true performs the redirect
    }
    setSubmitting(false);
    applyServerErrors(result.error.fieldErrors);
    setFormError(result.error.message);
  };

  const registerHref = rawRedirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register';

  return (
    <div className="page auth-page" data-testid="login-page">
      <div className="auth-card">
        <h1 className="page__title">Sign in</h1>
        {redirect === '/checkout' && (
          <Alert tone="info" testId="login-required-notice">
            Please sign in to continue to checkout. Your cart has been saved.
          </Alert>
        )}
        {formError && (
          <Alert tone="error" testId="login-error">
            {formError}
          </Alert>
        )}
        <form ref={formRef} className="form" onSubmit={onSubmit} noValidate data-testid="login-form" aria-label="Sign in">
          <TextField id="login-email" label="Email" type="email" autoComplete="email" required {...field('email')} />
          <TextField
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            {...field('password')}
          />
          <button type="submit" className="button button--primary button--block button--large" disabled={submitting} data-testid="login-submit">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-card__switch">
          New to ShopNest?{' '}
          <Link to={registerHref} data-testid="go-to-register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

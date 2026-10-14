import { useState } from 'react';
import { Alert } from '../components/StatusViews';
import { SEED_USERS } from '../data/users';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { config } from '../lib/config';
import { demoService } from '../services/demoService';
import { NotFoundPage } from './NotFoundPage';

/**
 * DEMO-ONLY maintenance page at /__demo. Not linked from the storefront.
 * Available in `npm run dev`, or in builds created with VITE_ENABLE_DEMO_TOOLS=true; otherwise it renders 404.
 */
export function DemoToolsPage() {
  useDocumentTitle('Demo tools');
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');

  if (!config.demoToolsEnabled) return <NotFoundPage />;

  const onReset = async () => {
    setStatus('working');
    await demoService.resetDemoData();
    setStatus('done');
    // Full reload so every in-memory state (session, cart, drafts) is re-initialised from clean storage.
    window.setTimeout(() => window.location.assign('/'), 600);
  };

  return (
    <div className="page" data-testid="demo-tools-page">
      <h1 className="page__title">Demo tools</h1>
      <p className="page__subtitle">Developer utilities for the ShopNest demo environment. Not part of the storefront.</p>

      <section className="panel stack" aria-labelledby="reset-heading">
        <h2 id="reset-heading" className="panel__title">
          Reset demo data
        </h2>
        <p>
          Restores seeded users only, signs everyone out, empties the cart, deletes checkout drafts and order history,
          and resets order numbering to ORD-100001.
        </p>
        <div>
          <button type="button" className="button button--danger" onClick={onReset} disabled={status !== 'idle'} data-testid="demo-reset">
            {status === 'working' ? 'Resetting…' : 'Reset demo data'}
          </button>
        </div>
        {status === 'done' && (
          <Alert tone="success" testId="demo-reset-success">
            Demo data has been reset. Reloading…
          </Alert>
        )}
      </section>

      <section className="panel stack" aria-labelledby="accounts-heading">
        <h2 id="accounts-heading" className="panel__title">
          Seeded accounts
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Password</th>
              </tr>
            </thead>
            <tbody>
              {SEED_USERS.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <code>{u.password}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

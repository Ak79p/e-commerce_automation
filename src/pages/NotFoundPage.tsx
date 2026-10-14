import { Link } from 'react-router-dom';
import { MessageState } from '../components/StatusViews';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="page" data-testid="not-found-page">
      <MessageState
        asPageHeading
        testId="not-found"
        title="Page not found"
        message={<p>Sorry, the page you are looking for does not exist or has moved.</p>}
        actions={
          <>
            <Link to="/" className="button button--primary" data-testid="go-home">
              Go to home page
            </Link>
            <Link to="/products" className="button button--outline">
              Browse products
            </Link>
          </>
        }
      />
    </div>
  );
}

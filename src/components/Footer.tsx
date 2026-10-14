import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { useAuth } from '../context/AuthContext';

export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="container site-footer__grid">
        <section aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="site-footer__heading">
            Shop
          </h2>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/products">All Products</Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/products?category=${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="footer-account">
          <h2 id="footer-account" className="site-footer__heading">
            Your Account
          </h2>
          <ul>
            {user ? (
              <li>
                <Link to="/orders">My Orders</Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login">Sign in</Link>
                </li>
                <li>
                  <Link to="/register">Create an account</Link>
                </li>
              </>
            )}
            <li>
              <Link to="/cart">Shopping Cart</Link>
            </li>
            <li>
              <Link to="/checkout">Checkout</Link>
            </li>
          </ul>
        </section>
        <section aria-labelledby="footer-about">
          <h2 id="footer-about" className="site-footer__heading">
            About ShopNest
          </h2>
          <p>
            ShopNest is a demonstration store. Products, accounts and orders are simulated in your browser. No real orders
            are shipped and no payment is collected.
          </p>
          <p>Free delivery on orders of ₹499 or more.</p>
        </section>
      </div>
      <p className="container site-footer__legal">© 2026 ShopNest Demo. For testing purposes only.</p>
    </footer>
  );
}

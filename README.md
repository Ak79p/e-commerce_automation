# ShopNest — E-Commerce Demo Application

ShopNest is a responsive online store inspired by modern marketplaces, built as a **demo environment for testing AI agents and browser automation**. Everything runs in the browser: there is no backend. Products, accounts, the cart and orders come from a deterministic mock API layer that persists to `localStorage`.

> ⚠️ Demo only. Authentication is mocked and passwords are stored in plain text in `localStorage`. No real payments, orders or emails are processed.

## Technology stack

- React 18 + TypeScript (strict)
- Vite 6 (dev server and production build)
- React Router 7 (client-side routing, `BrowserRouter`)
- Plain responsive CSS (`src/styles/global.css`, breakpoints at 1024 / 900 / 640 / 400 px)
- An async mock service layer with simulated latency
- Browser `localStorage`, accessed through a storage abstraction

## Prerequisites

- Node.js **20.19+** (or 22.12+)
- npm 10+

## Commands

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Development server (http://localhost:5173) | `npm run dev` |
| Type check | `npm run typecheck` |
| Production build (type check + bundle to `dist/`) | `npm run build` |
| Serve the production build (http://localhost:4173) | `npm run preview` |

The app uses client-side routing. If you host `dist/` elsewhere, configure the server to fall back to `index.html` for unknown paths. `vite preview` already does this.

### Environment variables (optional)

Copy `.env.example` to `.env.local` to change these:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_MOCK_LATENCY_MS` | `300` | Simulated latency of every mock API call. Set it to `0` for the fastest runs. |
| `VITE_ENABLE_DEMO_TOOLS` | `false` | Enables the `/__demo` reset page in production builds. It is always enabled in `npm run dev`. |

## Demo credentials

| Name | Email | Password | User ID |
| --- | --- | --- | --- |
| Demo User | `demo@shopnest.test` | `Demo@1234` | `USR-0001` |
| Priya Sharma | `priya@shopnest.test` | `Priya@1234` | `USR-0002` |

- Email matching is case-insensitive. Passwords are case-sensitive.
- Newly registered users get the IDs `USR-1001`, `USR-1002` and so on.

## Routes

| Path | Page | Auth |
| --- | --- | --- |
| `/` | Home: hero, category tiles, first 10 products | – |
| `/products` | Product listing. Query params: `q` (search), `category`, `sort` (`featured`, `price-asc`, `price-desc`, `name-asc`) | – |
| `/product/:productId` | Product details (unknown ID shows "Product not found") | – |
| `/cart` | Shopping cart | – |
| `/login`, `/register` | Sign in and registration. Both accept `?redirect=/path` | – |
| `/checkout` | Shipping form and order summary | **Required** |
| `/order-confirmation/:orderId` | Order confirmation | **Required** (owner only) |
| `/orders` | Order history | **Required** |
| `/__demo` | Demo tools (reset). Not linked from the storefront | dev only |
| anything else | "Page not found" | – |

## Seeded product catalogue

All prices are whole INR and include taxes. Product data is static and never changes at runtime: **stock does not go down when orders are placed**, so every run starts from the same catalogue.

| ID | Name | Category | Price (₹) | MRP (₹) | Stock | Availability |
| --- | --- | --- | ---: | ---: | ---: | --- |
| PROD-001 | Wireless Headphones | electronics | 2,999 | 4,999 | 25 | In stock |
| PROD-002 | Mechanical Keyboard | electronics | 3,499 | 4,499 | 12 | In stock |
| PROD-003 | Running Shoes | fashion | 2,499 | 3,999 | 30 | In stock |
| PROD-004 | Stainless Steel Water Bottle | home-kitchen | 649 | 999 | 50 | In stock |
| PROD-005 | Laptop Stand | accessories | 1,599 | 2,499 | 35 | In stock |
| PROD-006 | Bluetooth Speaker | electronics | 1,899 | 2,999 | 40 | In stock |
| PROD-007 | Smart Watch | electronics | 4,499 | 6,999 | 15 | In stock |
| PROD-008 | USB-C Power Bank | electronics | 1,299 | 1,999 | 0 | **Out of stock** |
| PROD-009 | Cotton Crew T-Shirt | fashion | 499 | 799 | 100 | In stock |
| PROD-010 | Denim Jacket | fashion | 2,199 | 3,499 | 8 | In stock |
| PROD-011 | Leather Belt | fashion | 799 | 1,299 | 3 | **Low stock** (only 3) |
| PROD-012 | Non-Stick Frying Pan | home-kitchen | 1,199 | 1,799 | 20 | In stock |
| PROD-013 | Ceramic Coffee Mug Set | home-kitchen | 899 | 1,299 | 18 | In stock |
| PROD-014 | Electric Kettle | home-kitchen | 1,499 | 2,199 | 0 | **Out of stock** |
| PROD-015 | Cotton Bath Towel Set | home-kitchen | 999 | 1,499 | 22 | In stock |
| PROD-016 | Learning TypeScript Basics | books | 599 | 799 | 27 | In stock |
| PROD-017 | The Monsoon Garden | books | 349 | 499 | 60 | In stock |
| PROD-018 | Everyday Indian Cooking | books | 449 | 699 | 14 | In stock |
| PROD-019 | Mindful Mornings | books | 299 | 399 | 2 | **Low stock** (only 2) |
| PROD-020 | Laptop Backpack | accessories | 1,799 | 2,799 | 16 | In stock |
| PROD-021 | Wireless Mouse | accessories | 699 | 999 | 45 | In stock |
| PROD-022 | Polarized Sunglasses | accessories | 1,299 | 2,499 | 9 | In stock |
| PROD-023 | Shockproof Phone Case | accessories | 399 | 699 | 0 | **Out of stock** |
| PROD-024 | Travel Wallet | accessories | 599 | 999 | 11 | In stock |

Category slugs and names: `electronics` (Electronics), `fashion` (Fashion), `home-kitchen` (Home & Kitchen), `books` (Books), `accessories` (Accessories).

Product images are SVG illustrations generated locally from the category and product ID, so no network is needed. To use real images, set `image` on a product to a path under `public/`.

## Business rules

### Search

- The query is trimmed, case-insensitive and matched as a substring (partial match) against the **product name, brand and category name**. For example, `head`, `HEAD` and `Headphones` all find PROD-001.
- Searching from the header goes to `/products?q=<query>` across all categories. An empty query shows every product.
- Queries with no matches show "No products found" (`data-testid="no-results"`). An unknown `category` value shows the same empty state.

### Cart

- The cart is stored **per browser**, not per user. It is kept across reloads, login and logout.
- The most you can buy of one product is `min(stock, 10)`. Adding past that limit returns a clear error, and out-of-stock products can't be added.
- Typed quantities are committed on blur or Enter. Non-integers, values below 1 and values above the maximum show an error and revert. The decrease button is disabled at 1 (use "Remove" to delete a line).
- Cart data loaded from storage is sanitised: unknown or out-of-stock products are dropped, duplicate lines are merged and quantities are clamped.

### Pricing

- Subtotal is the sum of `price × quantity`.
- **Delivery is ₹40 when the subtotal is under ₹499, and free when it is ₹499 or more.**
- Total is subtotal plus delivery. The cart, checkout and confirmation pages all use the same calculation (`src/lib/pricing.ts`).

### Authentication and checkout policy

- **You must be signed in to check out.** Opening `/checkout` while signed out redirects to `/login?redirect=%2Fcheckout` (a history *replace*, so Back doesn't loop). The cart is kept, and after signing in or registering you return to checkout.
- Registering signs the new user in straight away.
- Signing out returns you to `/` and deletes that user's checkout draft. The cart is kept.
- `/checkout` with an empty cart shows "Your cart is empty" (`checkout-empty-cart`).

### Checkout form and draft persistence

| Field | Rule |
| --- | --- |
| Full name | required, at least 2 characters |
| Email | required, valid email format |
| Phone | required, Indian mobile number: 10 digits starting with 6–9 (spaces and hyphens ignored) |
| Address line | required, at least 5 characters |
| City | required, letters, spaces and `. ' -` only |
| State | required, chosen from the list of Indian states and union territories |
| Postal code | required, 6-digit PIN that doesn't start with 0 |

- **When fields are validated:** on blur, again on every change once a field has been touched, and all fields on submit. On a failed submit, an error summary appears and the first invalid field gets focus. An error disappears as soon as the value is corrected.
- **Draft:** every value is saved as you type, for each user (`shopnest:v1:checkoutDraft:<userId>`). The draft survives reloads, moving between cart and checkout, and browser Back/Forward. A new draft is pre-filled with the account name and email. Error messages are not saved.
- **Placing an order:** the order is recorded as **Cash on Delivery**, and no payment details are collected. The cart and draft are cleared, and the app goes to `/order-confirmation/ORD-xxxxxx` with a history *replace*, so Back after ordering goes to the cart, not checkout.
- **Order numbers:** order IDs run in sequence from **`ORD-100001`**. Users can only see their own orders.

## Mock API behaviour

Services live in `src/services/` and behave like a network API:

- Each call is asynchronous and waits `VITE_MOCK_LATENCY_MS` (default 300 ms). Loading states appear meanwhile (`data-testid="loading"`).
- Every call resolves to a consistent envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`.
- Error codes: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `NOT_FOUND`, `UNAUTHENTICATED`, `EMPTY_CART`, `OUT_OF_STOCK`, `QUANTITY_LIMIT`, `UNKNOWN`.
- The services re-validate everything (registration, login, shipping, stock), so the UI is never the only check.
- Cart operations are synchronous and pure (`cartService`), so the header count updates immediately.

| Service | Operations |
| --- | --- |
| `productService` | `listProducts({ q, category, sort })`, `getProduct(id)` |
| `authService` | `login`, `register`, `logout`, `getCurrentUser` |
| `cartService` | `addItem`, `setQuantity`, `removeItem`, `toLines`, `summarize`, `load`/`save` |
| `checkoutService` | `loadDraft`, `saveDraft`, `clearDraft` |
| `orderService` | `placeOrder`, `getOrder`, `listOrders` |
| `demoService` | `resetDemoData` |

## Persistence

All data is kept in `localStorage` under the prefix `shopnest:v1:`, through `src/lib/storage.ts`:

| Key | Contents |
| --- | --- |
| `shopnest:v1:users` | Registered users. Seeded users always come from code. |
| `shopnest:v1:session` | `{ userId, token, createdAt }` for the signed-in user |
| `shopnest:v1:cart` | `[{ productId, quantity }]` |
| `shopnest:v1:checkoutDraft:<userId>` | Saved shipping form values |
| `shopnest:v1:orders` | Placed orders |
| `shopnest:v1:orderSequence` | The next order number |

- **Corrupted data:** invalid JSON or the wrong shape is discarded, logged as a console warning, and replaced with the default value.
- **Storage unavailable:** if `localStorage` can't be used, the app falls back to in-memory storage.
- **Multiple tabs:** changes to the cart or session made in another tab are picked up automatically.

## Resetting demo data

A reset restores: seeded users only, signed-out state, an empty cart, no checkout drafts, no orders, and order numbering starting again at `ORD-100001`.

1. **Demo tools page.** Open **`/__demo`** and click **Reset demo data** (`data-testid="demo-reset"`). The app clears its storage and reloads at `/`. This page is available in `npm run dev`. In production builds it shows 404 unless you build with `VITE_ENABLE_DEMO_TOOLS=true npm run build`. It is not linked from the storefront.
2. **Clear storage manually.** Delete every `localStorage` key that starts with `shopnest:v1:` (or clear site data), then reload. A fresh browser context, such as a new incognito window or a new automation context, always starts in the seeded state.

## Agent-friendly UI conventions

- **Semantic markup:** `header`, `nav` (with labels), `main`, `footer`, `form` and `role="search"`. Each page has exactly one `h1`.
- **Accessible controls:** every input has a `<label>`. Errors are linked with `aria-describedby` and `aria-invalid`. Buttons have accessible names, for example "Add to cart: Wireless Headphones", "Increase quantity of Laptop Stand", and the cart link "Cart, 3 items".
- **Toasts:** notifications appear in an `aria-live` region (`data-testid="toast"`, with `data-tone`) and dismiss themselves after 5 seconds.
- **Data attributes:** amounts are exposed as `data-amount` (whole rupees) on totals, and products as `data-product-id` on cards and cart lines.
- **Stable test IDs** (all static except the product or order ID suffix):

| Area | Test IDs |
| --- | --- |
| Header | `brand-link`, `product-search`, `search-submit`, `login-link`, `register-link`, `user-greeting`, `orders-link`, `logout-button`, `cart-link`, `cart-count`, `category-link-<slug>`, `category-link-all` |
| Listing | `listing-heading`, `results-count`, `sort-select`, `search-results`, `product-grid`, `no-results`, `product-card-<ID>`, `product-link-<ID>`, `product-price-<ID>`, `product-availability-<ID>`, `add-to-cart-<ID>`, `in-cart-<ID>` |
| Details | `product-title`, `product-id`, `product-price`, `product-availability`, `product-description`, `product-quantity`, `add-to-cart-<ID>`, `go-to-cart`, `in-cart-quantity`, `add-to-cart-success`, `add-to-cart-error`, `max-in-cart`, `product-not-found` |
| Cart | `cart-items`, `cart-item-<ID>`, `cart-item-name-<ID>`, `cart-item-price-<ID>`, `cart-item-subtotal-<ID>`, `cart-quantity-<ID>`, `cart-quantity-<ID>-error`, `cart-increase-<ID>`, `cart-decrease-<ID>`, `remove-from-cart-<ID>`, `cart-subtotal`, `cart-delivery`, `cart-total`, `proceed-to-checkout`, `continue-shopping`, `empty-cart` |
| Auth | `login-form`, `login-email`, `login-password`, `login-submit`, `login-error`, `login-required-notice`, `signup-form`, `signup-name`, `signup-email`, `signup-password`, `signup-confirm-password`, `signup-submit`, field errors `<field-id>-error` |
| Checkout | `checkout-form`, `checkout-full-name`, `checkout-email`, `checkout-phone`, `checkout-address`, `checkout-city`, `checkout-state`, `checkout-postal-code` (errors: `<id>-error`), `checkout-error-summary`, `checkout-error`, `checkout-submit`, `back-to-cart`, `checkout-items`, `checkout-subtotal`, `checkout-delivery`, `checkout-total`, `checkout-empty-cart` |
| Orders | `order-confirmation`, `order-id`, `order-items`, `order-item-<ID>`, `order-total`, `order-shipping-address`, `view-orders`, `order-list`, `order-row-<ORD>`, `no-orders`, `order-not-found` |
| Misc | `not-found`, `loading`, `toast`, `demo-reset` |

## Architecture

```
src/
├── main.tsx, App.tsx       # entry point, providers, route table
├── types/                  # shared domain types and the ApiResult envelope
├── data/                   # seed data: products, categories, users, Indian states
├── lib/                    # framework-free utilities
│   ├── storage.ts          #   namespaced, validated localStorage wrapper
│   ├── validation.ts       #   registration, login, shipping and quantity rules
│   ├── pricing.ts          #   subtotal, delivery and total calculation
│   ├── format.ts, redirect.ts, config.ts
├── services/               # mock API layer (all business logic lives here)
├── context/                # React state: Auth, Cart, Notice (toasts)
├── hooks/                  # useAsync, useForm, useDocumentTitle
├── components/             # presentational and layout components
├── pages/                  # one component per route
└── styles/global.css
```

Pages and components call services through contexts or hooks and contain no business rules. Validation and pricing are pure functions shared by the UI (for instant feedback) and the services (for the authoritative check).

## Known limitations

- There is no real backend, and data is per browser profile. Two browsers don't share users, carts or orders.
- Passwords are stored in plain text, and sessions never expire (demo only).
- Stock is static and isn't reduced by orders. Orders can't be cancelled or edited.
- Payment is always simulated Cash on Delivery. No payment gateway is integrated.
- Product images are generated illustrations, one glyph per category, so for example the keyboard uses the electronics headphone glyph.
- There are no product reviews, wishlist, address book or account settings pages.
- The `/__demo` page uses a build-time flag, not real access control.

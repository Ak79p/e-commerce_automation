# Self-contained test runner: the ShopNest app and its Playwright suite in one image.
# Playwright's webServer starts the app inside the same container, so "localhost" is the container itself.
#
# Credentials are never baked in: pass them at run time (e.g. --env-file tests/playwright/.env).
#
#   docker build -t shopnest-tests .
#   docker run --rm --env-file tests/playwright/.env -v "$(pwd)/artifacts:/app/tests/playwright/artifacts" shopnest-tests
#   docker run --rm --env-file tests/playwright/.env -v "$(pwd)/artifacts:/app/tests/playwright/artifacts" shopnest-tests npm test

# Same version as @playwright/test in tests/playwright/package.json. The image ships the matching Chromium (desktop and
# Pixel 7 emulation) and WebKit (iPhone 14 emulation) builds with their OS dependencies.
FROM mcr.microsoft.com/playwright:v1.64.1-noble

ENV CI=true \
    BASE_URL=http://localhost:5173 \
    PW_ARTIFACTS_DIR=artifacts

WORKDIR /app

# Dependencies first (cached layers), installed exactly from the lockfiles.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tests/playwright/package.json tests/playwright/package-lock.json ./tests/playwright/
RUN npm ci --no-audit --no-fund --prefix tests/playwright

COPY . .

WORKDIR /app/tests/playwright
# Reports, traces, screenshots and videos go to /app/tests/playwright/artifacts: mount a host directory there.
VOLUME ["/app/tests/playwright/artifacts"]

CMD ["npm", "run", "test:smoke"]

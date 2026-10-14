/** Runtime configuration derived from Vite environment variables. */

function parseLatency(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 300;
}

export const config = {
  /** Simulated network latency for mock API calls, in milliseconds. */
  mockLatencyMs: parseLatency(import.meta.env.VITE_MOCK_LATENCY_MS),
  /** The /__demo reset page is available in dev, or in builds made with VITE_ENABLE_DEMO_TOOLS=true. */
  demoToolsEnabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_TOOLS === 'true',
  /** Maximum quantity of a single product per order. */
  maxQuantityPerItem: 10,
} as const;

/**
 * DEMO-ONLY reset utility. Clears every ShopNest localStorage key, which restores:
 * seeded users only (registered accounts removed), signed-out state, empty cart,
 * no checkout drafts, empty order history and the order number sequence (next order ORD-100001).
 */
import { storage } from '../lib/storage';
import type { ApiResult } from '../types';
import { ok, simulateRequest } from './api';

export const demoService = {
  resetDemoData(): Promise<ApiResult<null>> {
    return simulateRequest(() => {
      storage.clearAll();
      return ok(null);
    });
  },
};

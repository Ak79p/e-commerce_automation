/**
 * Checkout draft persistence. The draft (shipping form values exactly as typed) is stored per
 * signed-in user so it survives reloads and cart <-> checkout navigation. It is cleared after a
 * successful order and on logout.
 */
import { hasStringFields, storage, StorageKeys } from '../lib/storage';
import { SHIPPING_FIELDS } from '../lib/validation';
import type { ShippingDetails, User } from '../types';

const isDraft = (v: unknown): v is ShippingDetails => hasStringFields(v, [...SHIPPING_FIELDS]);

export function emptyShipping(user?: User | null): ShippingDetails {
  return {
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  };
}

export const checkoutService = {
  /** Returns the saved draft, or a new one pre-filled with the account name and email. */
  loadDraft(user: User): ShippingDetails {
    return storage.read(StorageKeys.checkoutDraft(user.id), emptyShipping(user), isDraft);
  },

  saveDraft(userId: string, draft: ShippingDetails): void {
    storage.write(StorageKeys.checkoutDraft(userId), draft);
  },

  clearDraft(userId: string): void {
    storage.remove(StorageKeys.checkoutDraft(userId));
  },
};

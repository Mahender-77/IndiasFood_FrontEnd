/**
 * Inventory / FIFO constants – shared for expiring-soon logic and future scaling.
 * Backend uses same logic: sell from earliest-expiry (non-expired) batches first.
 */

/** Days before expiry to treat as "Expiring Soon" (user-facing badge and admin views). */
export const EXPIRING_SOON_DAYS = 14;

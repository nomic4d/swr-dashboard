export const USER_QUOTA_BYTES = 5 * 1024 * 1024;
export const ASIF_QUOTA_BYTES = 100 * 1024 * 1024;
export const QUOTA_MESSAGE = "Contact system admin to upgrade your space.";

const QUOTA_BY_EMAIL: Record<string, number> = {
  "asif@adb.org": ASIF_QUOTA_BYTES,
};

export function quotaForEmail(email?: string | null) {
  if (!email) return USER_QUOTA_BYTES;
  return QUOTA_BY_EMAIL[email.toLowerCase()] ?? USER_QUOTA_BYTES;
}

export function exceedsQuota(usedBytes: number, incomingBytes: number, replaceBytes = 0, quota = USER_QUOTA_BYTES) {
  return usedBytes - replaceBytes + incomingBytes > quota;
}

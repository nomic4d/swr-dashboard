export const USER_QUOTA_BYTES = 5 * 1024 * 1024;
export const QUOTA_MESSAGE = "Contact system admin to upgrade your space.";

export function exceedsQuota(usedBytes: number, incomingBytes: number, replaceBytes = 0, quota = USER_QUOTA_BYTES) {
  return usedBytes - replaceBytes + incomingBytes > quota;
}

import { supabase } from "@/integrations/supabase/client";
import { QUOTA_MESSAGE, exceedsQuota, quotaForEmail } from "@/lib/uploadLimit";

export { QUOTA_MESSAGE, exceedsQuota, quotaForEmail };

const ledgerKey = (userId: string) => `swr-upload-used:${userId}`;

type StorageItem = {
  name: string;
  id: string | null;
  metadata: { size?: number } | null;
};

function readLocalUsed(userId: string) {
  return Number(localStorage.getItem(ledgerKey(userId)) || 0);
}

export function rememberUpload(userId: string, addedBytes: number, replacedBytes = 0) {
  const next = Math.max(0, readLocalUsed(userId) - replacedBytes + addedBytes);
  localStorage.setItem(ledgerKey(userId), String(next));
}

async function listFolder(bucket: string, prefix: string) {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [] as StorageItem[];
  return data as StorageItem[];
}

function itemBytes(item: StorageItem) {
  if (!item.id) return 0;
  return Number(item.metadata?.size || 0);
}

async function folderBytes(bucket: string, prefix: string) {
  const items = await listFolder(bucket, prefix);
  let total = 0;
  for (const item of items) {
    if (!item.id) {
      total += await folderBytes(bucket, prefix ? `${prefix}/${item.name}` : item.name);
    } else {
      total += itemBytes(item);
    }
  }
  return total;
}

export async function matchingBytes(bucket: string, prefix: string, namePrefix: string) {
  const items = await listFolder(bucket, prefix);
  return items.filter((item) => item.name.startsWith(namePrefix)).reduce((sum, item) => sum + itemBytes(item), 0);
}

export async function getUsedBytes(userId: string) {
  const listed = await folderBytes("event-media", userId)
    + await folderBytes("campaign-images", userId)
    + await matchingBytes("staff-avatars", "avatars", userId)
    + await matchingBytes("staff-avatars", "covers", userId);
  return Math.max(listed, readLocalUsed(userId));
}

export async function assertUploadQuota(userId: string, incomingBytes: number, replaceBytes = 0) {
  const { data } = await supabase.auth.getUser();
  const quota = quotaForEmail(data.user?.email);
  const used = await getUsedBytes(userId);
  if (exceedsQuota(used, incomingBytes, replaceBytes, quota)) {
    throw new Error(QUOTA_MESSAGE);
  }
}

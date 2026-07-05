export interface GalleryMediaItem {
  id: string;
  event_id: string;
  uploader_id: string;
  media_type?: string | null;
  caption?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface GalleryVisibilityOptions {
  currentUserId?: string;
  approvedUploaderIds?: string[];
  role?: string;
  canModerate?: boolean;
  moderation?: Record<string, { approved?: boolean; featured?: boolean }>;
}

export interface GalleryFilterOptions {
  query?: string;
  mediaType?: "all" | "photo" | "video";
  eventId?: string | null;
  sortBy?: "latest" | "oldest" | "popular" | "featured";
}

const normalize = (value: string | null | undefined) => String(value ?? "").toLowerCase();

export const getVisibleGalleryMedia = (
  media: GalleryMediaItem[],
  approvedUploaderIds: string[],
  eventId: string | null | undefined,
  options: GalleryVisibilityOptions = {},
) => {
  const approvedSet = new Set(approvedUploaderIds ?? []);
  const eventMatches = (item: GalleryMediaItem) => !eventId || eventId === "all" || item.event_id === eventId;

  return media.filter((item) => {
    if (!eventMatches(item)) return false;

    const moderationState = options.moderation?.[item.id];
    const isApproved = moderationState?.approved !== false;

    if (options.canModerate) return true;

    if (options.role === "staff" || options.role === "member") {
      return (approvedSet.has(item.uploader_id) || item.uploader_id === options.currentUserId) && isApproved;
    }

    return isApproved;
  });
};

export const filterAndSortGalleryMedia = (
  media: GalleryMediaItem[],
  options: GalleryFilterOptions = {},
) => {
  const query = normalize(options.query);
  const mediaType = options.mediaType ?? "all";
  const sortBy = options.sortBy ?? "latest";

  const filtered = media.filter((item) => {
    const matchesQuery = !query || [item.caption, item.media_type, item.event_id, item.uploader_id].some((value) => normalize(value).includes(query));
    const matchesType = mediaType === "all" || (mediaType === "photo" ? item.media_type !== "video" : item.media_type === "video");
    return matchesQuery && matchesType;
  });

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      case "popular":
        return Number(b.id?.length ?? 0) - Number(a.id?.length ?? 0);
      case "featured":
        return Number(Boolean((b as any).featured)) - Number(Boolean((a as any).featured));
      case "latest":
      default:
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    }
  });
};

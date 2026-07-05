import { describe, expect, it } from "vitest";
import { filterAndSortGalleryMedia, getVisibleGalleryMedia } from "./galleryUtils";

describe("getVisibleGalleryMedia", () => {
  it("returns only media from approved staff uploaders for the selected event", () => {
    const media = [
      { id: "1", event_id: "event-1", uploader_id: "approved-staff" },
      { id: "2", event_id: "event-1", uploader_id: "pending-staff" },
      { id: "3", event_id: "event-2", uploader_id: "approved-staff" },
    ];

    const visible = getVisibleGalleryMedia(media, ["approved-staff"], "event-1");

    expect(visible.map((item) => item.id)).toEqual(["1"]);
  });
});

describe("filterAndSortGalleryMedia", () => {
  it("filters by search term and media type, then sorts by newest first", () => {
    const media = [
      { id: "1", caption: "Sunset", media_type: "image", created_at: "2024-01-02T00:00:00Z" },
      { id: "2", caption: "Meeting clip", media_type: "video", created_at: "2024-01-03T00:00:00Z" },
      { id: "3", caption: "Beach", media_type: "image", created_at: "2024-01-01T00:00:00Z" },
    ];

    const visible = filterAndSortGalleryMedia(media, { query: "sun", mediaType: "photo", sortBy: "latest" });

    expect(visible.map((item) => item.id)).toEqual(["1"]);
  });
});

import { describe, expect, it } from "vitest";
import { USER_QUOTA_BYTES, exceedsQuota } from "./uploadLimit";

describe("upload quota", () => {
  it("allows a file inside the 5 MB share", () => {
    expect(exceedsQuota(0, 4 * 1024 * 1024)).toBe(false);
  });

  it("blocks a file past the 5 MB share", () => {
    expect(exceedsQuota(2 * 1024 * 1024, 4 * 1024 * 1024)).toBe(true);
  });

  it("treats a replacement as the new file size only", () => {
    expect(exceedsQuota(USER_QUOTA_BYTES, 1024 * 1024, USER_QUOTA_BYTES)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { resolveStaffMembers } from "./staffUtils";

describe("resolveStaffMembers", () => {
  it("maps Supabase profiles into the staff card model", () => {
    const result = resolveStaffMembers([
      {
        id: "profile-1",
        email: "staff@example.com",
        full_name: "Jane Doe",
        department: "Operations",
        role: "member",
        is_approved: true,
        avatar_url: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ] as any, null);

    expect(result[0]).toMatchObject({
      id: "profile-1",
      name: "Jane Doe",
      email: "staff@example.com",
      department: "Operations",
      is_active: true,
    });
  });
});

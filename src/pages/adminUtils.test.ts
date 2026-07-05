import { describe, expect, it } from "vitest";
import { isAdminUser } from "./adminUtils";

describe("isAdminUser", () => {
  it("treats the requested account as admin", () => {
    expect(isAdminUser("nom.studios@gmail.com", "member")).toBe(true);
  });

  it("treats explicit admin roles as admin", () => {
    expect(isAdminUser("user@example.com", "admin")).toBe(true);
  });
});

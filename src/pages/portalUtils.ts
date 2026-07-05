import { supabase } from "@/integrations/supabase/client";

export type PortalRole = "admin" | "manager" | "staff" | "member";

export const ADMIN_EMAIL = "nom.studios@gmail.com";
export const MANAGER_EMAILS = ["manager@organization.org", "asif@adb.org"];

let cachedDbRole: string | null = null;
let cachedDbRoleEmail: string | null = null;

export const getPortalRole = (email?: string | null, role?: string | null): PortalRole => {
  if (!email) return "member";
  const normalizedEmail = email.toLowerCase();
  if (role === "admin" || normalizedEmail === ADMIN_EMAIL.toLowerCase()) return "admin";
  if (role === "manager" || MANAGER_EMAILS.includes(normalizedEmail)) return "manager";
  return "staff";
};

export const refreshDbRole = async (email: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    const dbRole = data?.role || null;
    cachedDbRole = dbRole;
    cachedDbRoleEmail = email;
    return dbRole;
  } catch {
    return null;
  }
};

export const getPortalRoleWithDb = async (email?: string | null, metadataRole?: string | null): Promise<PortalRole> => {
  const quick = getPortalRole(email, metadataRole);
  if (quick === "admin" || quick === "manager") return quick;
  if (!email) return "member";
  const dbRole = await refreshDbRole(email);
  if (dbRole === "admin") return "admin";
  if (dbRole === "manager") return "manager";
  return "staff";
};

export const canAccessManager = (role: PortalRole | null | undefined) => role === "admin" || role === "manager";
export const canAccessAdmin = (role: PortalRole | null | undefined) => role === "admin";

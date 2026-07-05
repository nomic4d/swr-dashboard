export const ADMIN_EMAIL = "nom.studios@gmail.com";

export const isAdminUser = (email?: string | null, role?: string | null) => {
  if (!email) return false;
  if (role === "admin") return true;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

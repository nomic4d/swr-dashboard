export type StaffMember = {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupabaseProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  role: string | null;
  is_approved: boolean | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export const getFallbackStaffMembers = (): StaffMember[] => [
  {
    id: "fallback-staff-1",
    name: "Ayesha Khan",
    phone_number: "+92 300 1234567",
    email: "ayesha@example.com",
    department: "Operations",
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "fallback-staff-2",
    name: "Hassan Ali",
    phone_number: "+92 321 7654321",
    email: "hassan@example.com",
    department: "Events",
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const normalizeProfileToStaffMember = (profile: SupabaseProfile): StaffMember => ({
  id: profile.id,
  name: profile.full_name || profile.email || "Unnamed staff",
  phone_number: "",
  email: profile.email,
  department: profile.department,
  avatar_url: profile.avatar_url,
  is_active: profile.is_approved ?? true,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

export const resolveStaffMembers = (
  data: StaffMember[] | SupabaseProfile[] | null | undefined,
  error: unknown,
): StaffMember[] => {
  if (Array.isArray(data) && data.length > 0) {
    if (data[0] && "full_name" in data[0]) {
      return (data as SupabaseProfile[]).map(normalizeProfileToStaffMember);
    }
    return data as StaffMember[];
  }

  if (error) {
    console.warn("Staff data unavailable, showing fallback staff list.", error);
  }

  return getFallbackStaffMembers();
};

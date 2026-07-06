import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, UserPlus, RotateCcw, Pencil, Trash2, Loader2, Wallet,
  Users, Calendar, UserCircle, LayoutDashboard, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "./adminUtils";
import { cn } from "@/lib/utils";
import BudgetManagementView from "@/components/budget/BudgetManagementView";
import CalendarView from "@/components/CalendarView";
import ContributorsView from "@/components/ContributorsView";
import StaffView from "@/components/StaffView";
import { getPortalRole } from "./portalUtils";

interface AdminProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  role: string | null;
  is_approved: boolean | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

type AdminTab = "dashboard" | "budget" | "staff" | "calendar" | "contributors" | "profile";

const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "budget", label: "Manage Budget", icon: Wallet },
  { id: "staff", label: "Manage Staff", icon: Users },
  { id: "calendar", label: "Manage Events", icon: Calendar },
  { id: "contributors", label: "Contributors", icon: UserCircle },
  { id: "profile", label: "My Profile", icon: Shield },
];

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const role = useMemo(() => getPortalRole(user?.email, (user as any)?.user_metadata?.role), [user]);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", department: "" });
  const [busy, setBusy] = useState(false);
  const [resetPwTarget, setResetPwTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPwValue, setResetPwValue] = useState("");
  const [resetPwOpen, setResetPwOpen] = useState(false);

  const { data: profiles = [], isLoading, isError } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, full_name, department, role, is_approved, avatar_url, created_at, updated_at").order("full_name");
      if (error) throw error;
      return (data ?? []) as AdminProfile[];
    },
    retry: 2,
    staleTime: 15000,
  });

  const isCurrentUserAdmin = useMemo(() => {
    if (isAdminUser(user?.email)) return true;
    const adminProfile = profiles.find((p) => p.email === user?.email);
    return adminProfile?.role === "admin" || isAdminUser(user?.email, adminProfile?.role);
  }, [profiles, user?.email]);

  const createUser = useMutation({
    mutationFn: async () => {
      const effectivePassword = form.password || "@ABCD1234!";
      const { data: createdUser, error } = await supabase.auth.signUp({
        email: form.email,
        password: effectivePassword,
        options: { data: { full_name: form.full_name } },
      });
      if (error) throw error;
      if (!createdUser.user) throw new Error("User could not be created");

      const { data: staffRecord, error: staffError } = await supabase.from("staff").insert({
        name: form.full_name,
        phone_number: "000-0000000",
        email: form.email,
        department: form.department || null,
        is_active: true,
      }).select().single();
      if (staffError) throw staffError;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: createdUser.user.id,
        email: form.email,
        full_name: form.full_name,
        department: form.department || null,
        role: "staff",
        is_approved: true,
      }, { onConflict: "id" });
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setForm({ email: "", password: "", full_name: "", department: "" });
      toast.success("User created as staff member");
    },
    onError: (error: any) => toast.error(error?.message || "User creation failed"),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminProfile> }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Profile updated");
    },
    onError: (error: any) => toast.error(error?.message || "Update failed"),
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Profile deleted");
    },
    onError: (error: any) => toast.error(error?.message || "Delete failed"),
  });

  const resetPassword = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
      if (error) {
        if (error.message?.includes("SMTP") || error.message?.includes("email") || error.message?.includes("configuration")) {
          const link = `${window.location.origin}/auth?reset=${encodeURIComponent(email)}`;
          navigator.clipboard.writeText(link);
          throw new Error("Email service not configured. Reset link copied to clipboard.");
        }
        throw error;
      }
    },
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (error: any) => toast.error(error?.message || "Password reset failed"),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createUser.mutateAsync();
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword.mutateAsync(email);
    } catch (e: any) {
      if (e?.message?.includes("clipboard")) {
        toast.success("Reset link copied to clipboard");
      }
    }
  };

  const directResetPw = useMutation({
    mutationFn: async ({ targetUserId, newPassword }: { targetUserId: string; newPassword: string }) => {
      const { error } = await supabase.rpc("admin_reset_password", {
        target_user_id: targetUserId,
        new_password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setResetPwOpen(false);
      setResetPwValue("");
      setResetPwTarget(null);
    },
    onError: (error: any) => toast.error(error?.message || "Password reset failed"),
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!user || !isCurrentUserAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Only admins can access this page.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go back home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 gradient-navy min-h-screen flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">
            SWR <span className="text-gradient">Admin</span>
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Full system control</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => navigate("/")}>
            <LogOut className="h-4 w-4 mr-2" />Back to app
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
          {activeTab === "dashboard" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Manage budgets, staff, events, and system settings.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total Budgets", value: "12", icon: Wallet, desc: "PKR 2.8M allocated" },
                  { label: "Staff Members", value: String(profiles.length), icon: Users, desc: "Registered users" },
                  { label: "Events", value: "10", icon: Calendar, desc: "2026 calendar" },
                  { label: "Pending Approval", value: profiles.filter((p) => !p.is_approved).length.toString(), icon: Shield, desc: "Awaiting review" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-semibold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.desc}</p>
                        </div>
                        <div className="rounded-full bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Direct password reset dialog */}
          <Dialog open={resetPwOpen} onOpenChange={(o) => { if (!o) { setResetPwOpen(false); setResetPwValue(""); } }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Set Password for {resetPwTarget?.name}</DialogTitle>
                <DialogDescription>Enter a new password for this user.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="password" placeholder="New password (min 6 chars)" minLength={6} value={resetPwValue} onChange={(e) => setResetPwValue(e.target.value)} />
                <Button className="w-full" disabled={resetPwValue.length < 6 || directResetPw.isPending} onClick={() => resetPwTarget && directResetPw.mutate({ targetUserId: resetPwTarget.id, newPassword: resetPwValue })}>
                  {directResetPw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Set Password
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {activeTab === "budget" && (
            <BudgetManagementView role={role} />
          )}

          {activeTab === "staff" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Add team member</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={busy || createUser.isPending} className="w-full md:w-auto">
                        {(busy || createUser.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add user
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Team members</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading members…</p>
                  ) : (
                    <div className="space-y-3">
                      {profiles.map((profile) => (
                        <div key={profile.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold">{profile.full_name || profile.email}</p>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                            <p className="text-sm text-muted-foreground">{profile.department || "No department"}</p>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{profile.role || "member"} • {profile.is_approved ? "Approved" : "Pending"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => updateProfile.mutate({ id: profile.id, updates: { is_approved: !(profile.is_approved ?? false) } })}>
                              <Pencil className="mr-2 h-4 w-4" />{profile.is_approved ? "Unapprove" : "Approve"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => updateProfile.mutate({ id: profile.id, updates: { role: profile.role === "admin" ? "staff" : "admin" } })}>
                              <Shield className="mr-2 h-4 w-4" />{profile.role === "admin" ? "Remove admin" : "Make admin"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setResetPwTarget({ id: profile.id, name: profile.full_name || profile.email || "" }); setResetPwOpen(true); }}>
                              <RotateCcw className="mr-2 h-4 w-4" />Set Password
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteProfile.mutate(profile.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "calendar" && (
            <CalendarView />
          )}

          {activeTab === "contributors" && (
            <ContributorsView />
          )}

          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Admin Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="font-medium">Admin</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="font-mono text-sm text-muted-foreground">{user?.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => navigate("/"))}>
                    <LogOut className="h-4 w-4 mr-2" />Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;

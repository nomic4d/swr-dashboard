import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Phone, Trash2, UserCheck, UserX, Mail, Send, User as UserIcon, Upload, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRole, canAccessManager } from "@/pages/portalUtils";

const StaffView = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = getPortalRole(user?.email, user?.user_metadata?.role);
  const isManager = canAccessManager(role);
  const [open, setOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string; email: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState("SWR PRM - Event Reminder");
  const [emailBody, setEmailBody] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: staffData = [], error: staffError } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("*").order("name");
      return data ?? [];
    },
    staleTime: 30000,
  });

  const { data: profileData = [] } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, department, role, is_approved, avatar_url, created_at")
        .order("full_name");
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name || p.email || "Unknown",
        phone_number: "N/A",
        email: p.email || "",
        department: p.department || "",
        avatar_url: p.avatar_url,
        is_active: p.is_approved ?? true,
        created_at: p.created_at,
      }));
    },
    staleTime: 30000,
  });

  const staff = useMemo(() => {
    const staffEmails = new Set((staffData ?? []).map((s: any) => s.email).filter(Boolean));
    const profileMembers = (profileData ?? []).filter((p: any) => !staffEmails.has(p.email));
    return [...(staffData ?? []), ...profileMembers];
  }, [staffData, profileData]);

  const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleAdd = async () => {
    if (!name || !phone) return;
    setBusy(true);
    try {
      let avatar_url: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("staff-avatars").upload(path, avatarFile);
        if (upErr) throw upErr;
        avatar_url = supabase.storage.from("staff-avatars").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("staff").insert({
        name, phone_number: phone, email: email || null, department: department || null, avatar_url,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setName(""); setPhone(""); setEmail(""); setDepartment(""); setAvatarFile(null); setOpen(false);
      toast.success("Staff member added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add staff");
    } finally { setBusy(false); }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("staff").update({ is_active: !is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member removed");
    },
  });

  const handleSendEmail = (member: { id: string; name: string; email: string | null }) => {
    if (!member.email) {
      toast.error("No email address set for this staff member");
      return;
    }
    setSelectedStaff({ id: member.id, name: member.name, email: member.email });
    setEmailSubject("SWR PRM - Event Reminder");
    setEmailBody(`Dear ${member.name},\n\nThis is a reminder about an upcoming SWR event.\n\nPlease confirm your attendance.\n\nBest regards,\nSWR PRM Team`);
    setEmailOpen(true);
  };

  const confirmSendEmail = () => {
    if (!selectedStaff) return;
    const mailtoUrl = `mailto:${encodeURIComponent(selectedStaff.email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, "_blank");
    toast.success(`Email draft opened for ${selectedStaff.name}`);
    setEmailOpen(false);
  };

  return (
    <div className="space-y-3 animate-fade-in relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none rounded-xl overflow-hidden" style={{ backgroundImage: "url('https://media.istockphoto.com/id/2184773448/photo/overhead-shot-of-business-panel-in-office-meeting-collaborating-around-large-table.jpg?s=612x612&w=0&k=20&c=NzQ7IQQnvvj8Z9K8iOw0I6kK6rX24PyoloIgQIEtAGc=')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Staff Management</h2>
          <p className="text-muted-foreground text-sm mt-1">{staff.length} members registered</p>
          {staffError && <p className="text-xs text-amber-600 mt-1">Could not load staff data.</p>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                  <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {name ? initials(name) : <UserIcon className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Profile Picture (optional)</Label>
                  <label className="mt-1 flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent cursor-pointer text-sm">
                    <Upload className="h-4 w-4" />
                    <span>{avatarFile ? avatarFile.name : "Choose image"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </div>
              <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Phone Number (with country code)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input placeholder="Email Address (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Department (optional)" value={department} onChange={(e) => setDepartment(e.target.value)} />
              <Button onClick={handleAdd} className="w-full">
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Send Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification to {selectedStaff?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">To</label>
              <Input value={selectedStaff?.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Message</label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} />
            </div>
            <Button onClick={confirmSendEmail} disabled={!emailSubject || !emailBody} className="w-full gap-2">
              <Send className="h-4 w-4" /> Open in Email App
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member, index) => (
          <div
            key={member.id}
            className="glass-card rounded-xl p-5 animate-slide-up bg-card/20"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${member.is_active ? "bg-muted-foreground/40" : "bg-muted-foreground/30"}`} />
                  <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{member.phone_number}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.department && (
                  <span className="inline-block mt-2 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {member.department}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => toggleActive.mutate({ id: member.id, is_active: member.is_active })}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={member.is_active ? "Deactivate" : "Activate"}
                >
                  {member.is_active ? <UserCheck className="h-4 w-4 text-muted-foreground/40" /> : <UserX className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => deleteStaff.mutate(member.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link to={`/staff/${member.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  <UserIcon className="h-3.5 w-3.5" /> Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => handleSendEmail(member)}
                disabled={!member.email}
              >
                <Mail className="h-3.5 w-3.5" />
                {member.email ? "Email" : "No Email"}
              </Button>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No staff members yet. Add your first member to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffView;

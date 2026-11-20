import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Mail, Building2, BadgeCheck, Camera, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StaffProfile = () => {
  const { id } = useParams();

  const { data: member, isError, isLoading } = useQuery({
    queryKey: ["staff-profile", id],
    queryFn: async () => {
      const profileById = await supabase.from("profiles").select("id, email, full_name, department, role, is_approved, avatar_url").eq("id", id!).maybeSingle();
      if (profileById.error) throw profileById.error;
      const staffById = await supabase.from("staff").select("id, name, email, phone_number, department, avatar_url, is_active").eq("id", id!).maybeSingle();
      if (staffById.error) throw staffById.error;

      let profile = profileById.data;
      if (!profile && staffById.data?.email) {
        const profileByEmail = await supabase.from("profiles").select("id, email, full_name, department, role, is_approved, avatar_url").eq("email", staffById.data.email).maybeSingle();
        if (profileByEmail.error) throw profileByEmail.error;
        profile = profileByEmail.data;
      }

      const staff = staffById.data;
      if (!profile && !staff) return null;
      return {
        name: profile?.full_name || staff?.name || profile?.email || staff?.email || "Staff",
        email: profile?.email || staff?.email || "",
        phone: staff?.phone_number || "",
        department: profile?.department || staff?.department || "",
        role: profile?.role || "staff",
        approved: profile?.is_approved ?? staff?.is_active ?? true,
        avatar: profile?.avatar_url || staff?.avatar_url || "",
      };
    },
    enabled: !!id,
  });

  if (!id) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Invalid profile URL</div>;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading profile…</div>;
  if (isError) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Error loading profile</div>;
  if (!member) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Profile not found</div>;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>

        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-700 to-green-600" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-start gap-4">
                <div className="-mt-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary text-2xl font-semibold text-primary-foreground">
                  {member.avatar ? <img src={member.avatar} alt="" className="h-full w-full object-cover" /> : member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{member.name}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-sm text-success"><BadgeCheck className="h-4 w-4" />{member.approved ? "Approved" : "Pending"}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"><Shield className="h-4 w-4" />{member.role}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    {member.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {member.email}</div>}
                    {member.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {member.phone}</div>}
                    {member.department && <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {member.department}</div>}
                  </div>
                </div>
              </div>
              <Button variant="outline" className="gap-2"><Camera className="h-4 w-4" /> Update profile</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Profile details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {member.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {member.phone}</div>}
              <div>Designation: {member.role}</div>
              <div>Organization: ADB PRM</div>
              <div>Location: Islamabad</div>
              <div>Biography: Active contributor and support team member.</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">Donate</Button>
              <Button className="w-full justify-start" variant="outline">Contribute</Button>
              <Button className="w-full justify-start" variant="outline">View gallery</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;

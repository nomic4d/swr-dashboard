import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Heart, Trash2, Loader2, Lock, Trophy, HandHeart, Medal } from "lucide-react";
import { toast } from "sonner";
import { assertUploadQuota, QUOTA_MESSAGE, rememberUpload } from "@/lib/uploadQuota";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { DUMMY_DONORS } from "@/data/dummyDonors";

const CATEGORIES = ["Donation", "Helping the Poor", "Volunteering", "Disaster Relief", "Education", "Health", "Other"];

const ContributorsView = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Donation", goal_amount: "", file: null as File | null });

  // Contribute dialog
  const [contribOpen, setContribOpen] = useState(false);
  const [contribCampaign, setContribCampaign] = useState<{ id: string; title: string } | null>(null);
  const [contribForm, setContribForm] = useState({ name: "", amount: "", note: "" });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ["contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*, campaigns(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const d of DUMMY_DONORS) {
      map.set(d.name.toLowerCase(), { name: d.name, total: d.total, count: d.count });
    }
    for (const c of contributions) {
      const key = c.contributor_name.trim().toLowerCase();
      const cur = map.get(key) || { name: c.contributor_name, total: 0, count: 0 };
      cur.total += Number(c.amount) || 0;
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [contributions]);

  const handleCreate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (form.file) {
        await assertUploadQuota(user.id, form.file.size);
        const ext = form.file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("campaign-images").upload(path, form.file);
        if (error) throw error;
        await rememberUpload(user.id, form.file.size);
        imageUrl = supabase.storage.from("campaign-images").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("campaigns").insert({
        creator_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category,
        image_url: imageUrl,
        goal_amount: form.goal_amount ? Number(form.goal_amount) : 0,
      });
      if (error) throw error;
      toast.success("Campaign created");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setForm({ title: "", description: "", category: "Donation", goal_amount: "", file: null });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : QUOTA_MESSAGE);
    } finally { setBusy(false); }
  };

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Removed"); },
  });

  const submitContribution = async () => {
    if (!user || !contribCampaign) return;
    const amt = Number(contribForm.amount);
    if (!contribForm.name.trim() || !amt || amt <= 0) {
      toast.error("Enter name and a positive amount");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("contributions").insert({
        campaign_id: contribCampaign.id,
        contributor_id: user.id,
        contributor_name: contribForm.name.trim(),
        amount: amt,
        note: contribForm.note || null,
      });
      if (error) throw error;
      toast.success("Thank you for contributing! 🙏");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      setContribOpen(false);
      setContribForm({ name: "", amount: "", note: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  const openContribute = (c: { id: string; title: string }) => {
    setContribCampaign(c);
    setContribForm({ name: user?.email?.split("@")[0] ?? "", amount: "", note: "" });
    setContribOpen(true);
  };

  const medalColor = (i: number) =>
    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground";

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contributor Campaigns</h2>
          <p className="text-muted-foreground text-sm mt-1">Donations · helping the needy · volunteering</p>
        </div>
        {user ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Contributor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fundraising goal (PKR)</Label><Input type="number" min="0" value={form.goal_amount} onChange={(e) => setForm({ ...form, goal_amount: e.target.value })} /></div>
                <div><Label>Image (optional)</Label><Input type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} /></div>
                <Button className="w-full" onClick={handleCreate} disabled={!form.title || !form.description || busy}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Link to="/auth"><Button variant="outline" className="gap-2"><Lock className="h-4 w-4" /> Sign in to add</Button></Link>
        )}
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="campaigns" className="gap-1.5"><Heart className="h-3.5 w-3.5" /> Campaigns</TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Top Donors</TabsTrigger>
          <TabsTrigger value="recent" className="gap-1.5"><HandHeart className="h-3.5 w-3.5" /> Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          {campaigns.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No campaigns yet. Be the first to start one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((c, i) => {
                const goal = Number(c.goal_amount) || 0;
                const raised = Number(c.raised_amount) || 0;
                const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
                return (
                  <div key={c.id} className="glass-card rounded-xl overflow-hidden animate-slide-up flex flex-col" style={{ animationDelay: `${i * 60}ms` }}>
                    {c.image_url && <img src={c.image_url} alt={c.title} loading="lazy" className="w-full h-40 object-cover" />}
                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{c.category}</span>
                        {user?.id === c.creator_id && (
                          <button onClick={() => deleteCampaign.mutate(c.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-foreground">{c.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{c.description}</p>
                      {goal > 0 && (
                        <div className="pt-2">
                          <Progress value={pct} className="h-2" />
                          <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                            <span>PKR {raised.toLocaleString()} raised</span>
                            <span>Goal PKR {goal.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      {user ? (
                        <Button size="sm" className="w-full mt-2 gap-2" onClick={() => openContribute({ id: c.id, title: c.title })}>
                          <HandHeart className="h-4 w-4" /> Contribute
                        </Button>
                      ) : (
                        <Link to="/auth" className="mt-2">
                          <Button size="sm" variant="outline" className="w-full gap-2"><Lock className="h-3.5 w-3.5" /> Sign in to contribute</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          {leaderboard.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No donations yet. Be the first to contribute.</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl divide-y divide-border/50">
              {leaderboard.map((l, i) => (
                <div key={l.name + i} className="flex items-center justify-between p-4 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center h-9 w-9 rounded-full bg-muted ${medalColor(i)}`}>
                      {i < 3 ? <Medal className="h-5 w-5" /> : <span className="text-sm font-semibold">{i + 1}</span>}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.count} contribution{l.count > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">PKR {l.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          {contributions.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
              <HandHeart className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No contributions logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contributions.slice(0, 30).map((c, i) => {
                const camp = c.campaigns as { title: string } | null;
                return (
                  <div key={c.id} className="glass-card rounded-lg p-3 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 25}ms` }}>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{c.contributor_name}</p>
                      <p className="text-xs text-muted-foreground truncate">to {camp?.title || "—"}{c.note ? ` · ${c.note}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-semibold text-primary">PKR {Number(c.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contribute dialog */}
      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Contribute to {contribCampaign?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Your name</Label><Input value={contribForm.name} onChange={(e) => setContribForm({ ...contribForm, name: e.target.value })} /></div>
            <div><Label>Amount (PKR)</Label><Input type="number" min="1" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })} /></div>
            <div><Label>Note (optional)</Label><Textarea rows={2} value={contribForm.note} onChange={(e) => setContribForm({ ...contribForm, note: e.target.value })} /></div>
            <Button className="w-full gap-2" onClick={submitContribution} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}<HandHeart className="h-4 w-4" /> Confirm Contribution
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContributorsView;

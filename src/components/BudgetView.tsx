import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRole } from "@/pages/portalUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Wallet, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;
const statusColor: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  frozen: "bg-blue-100 text-blue-700 border-blue-200",
  closed: "bg-zinc-100 text-zinc-700 border-zinc-200",
  archived: "bg-red-100 text-red-700 border-red-200",
};

const initialForm = {
  title: "", category_id: "", event_id: "", campaign_id: "", department: "",
  allocated_amount: "", expected_cost: "", funding_source: "", budget_owner: "",
  priority: "medium", description: "", remarks: "", approval_required: true,
};

const BudgetView = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = getPortalRole(user?.email, (user as any)?.user_metadata?.role);
  const isManager = role === "manager" || role === "admin";
  const isAdmin = role === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [statusVal, setStatusVal] = useState("draft");

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data } = await supabase.from("budgets").select("*, budget_categories(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["budget_categories"],
    queryFn: async () => {
      const { data } = await supabase.from("budget_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("id, title").order("event_number");
      return data ?? [];
    },
  });

  const upsertBudget = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title, category_id: form.category_id || null,
        event_id: form.event_id || null, department: form.department || null,
        allocated_amount: Number(form.allocated_amount) || 0,
        expected_cost: Number(form.expected_cost) || 0,
        funding_source: form.funding_source || null,
        budget_owner: form.budget_owner || null,
        priority: form.priority, description: form.description || null,
        remarks: form.remarks || null, approval_required: form.approval_required,
      } as any;
      if (editId) {
        payload.status = statusVal;
        const { error } = await supabase.from("budgets").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success("Budget updated");
      } else {
        const { error } = await supabase.from("budgets").insert(payload);
        if (error) throw error;
        toast.success("Budget created");
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); setDialogOpen(false); setEditId(null); setForm(initialForm); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Deleted"); },
  });

  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({
      title: b.title || "", category_id: b.category_id || "", event_id: b.event_id || "",
      campaign_id: "", department: b.department || "", allocated_amount: String(b.allocated_amount || ""),
      expected_cost: String(b.expected_cost || ""), funding_source: b.funding_source || "",
      budget_owner: b.budget_owner || "", priority: b.priority || "medium",
      description: b.description || "", remarks: b.remarks || "", approval_required: b.approval_required ?? true,
    });
    setStatusVal(b.status || "draft");
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditId(null); setForm(initialForm); setStatusVal("draft"); setDialogOpen(true);
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Budgets</h2>
          <p className="text-sm text-muted-foreground">{budgets.length} budgets</p>
        </div>
        {isManager && (
          <Button size="sm" className="gap-1" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Allocate Budget
          </Button>
        )}
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No budgets yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgets.map((b: any) => {
            const pct = b.allocated_amount ? (Number(b.spent_amount) / Number(b.allocated_amount)) * 100 : 0;
            const remaining = Number(b.allocated_amount) - Number(b.spent_amount);
            return (
              <div key={b.id} className="rounded-xl border bg-card p-4 space-y-2 relative group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{b.title}</p>
                    <p className="text-[10px] text-muted-foreground">{b.budget_categories?.name || "Uncategorized"}</p>
                  </div>
                  <Badge className={`${statusColor[b.status] || ""} text-[10px] px-1.5 py-0`}>{b.status}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Allocated</span>
                  <span className="font-medium">{fmt(Number(b.allocated_amount))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium">{fmt(Number(b.spent_amount))}</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="flex justify-between text-[10px]">
                  <span className={remaining < 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                    {remaining < 0 ? "Overspent" : "Remaining"}: {fmt(remaining)}
                  </span>
                  <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                {b.budget_owner && <p className="text-[10px] text-muted-foreground">Owner: {b.budget_owner}</p>}
                {isManager && (
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1 rounded-md bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => { if (confirm("Delete this budget?")) deleteBudget.mutate(b.id); }} className="p-1 rounded-md bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shadow-sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setEditId(null); setForm(initialForm); } setDialogOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Budget" : "Allocate Budget"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Category</Label><Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Event</Label><Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}><SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger><SelectContent>{events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>Funding Source</Label><Input value={form.funding_source} onChange={(e) => setForm({ ...form, funding_source: e.target.value })} /></div>
            <div><Label>Allocated Amount (PKR)</Label><Input type="number" value={form.allocated_amount} onChange={(e) => setForm({ ...form, allocated_amount: e.target.value })} /></div>
            <div><Label>Expected Cost (PKR)</Label><Input type="number" value={form.expected_cost} onChange={(e) => setForm({ ...form, expected_cost: e.target.value })} /></div>
            <div><Label>Priority</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
            <div><Label>Budget Owner</Label><Input value={form.budget_owner} onChange={(e) => setForm({ ...form, budget_owner: e.target.value })} /></div>
            {editId && (
              <div><Label>Status</Label><Select value={statusVal} onValueChange={setStatusVal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="draft">Draft</SelectItem><SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem><SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="closed">Closed</SelectItem><SelectItem value="archived">Archived</SelectItem>
              </SelectContent></Select></div>
            )}
            <div className="flex items-center gap-2 col-span-2">
              <Switch checked={form.approval_required} onCheckedChange={(v) => setForm({ ...form, approval_required: v })} />
              <Label className="text-sm">Approval Required</Label>
            </div>
            <div className="col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-span-2"><Label>Remarks</Label><Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
          </div>
          <Button onClick={() => upsertBudget.mutate()} className="w-full" disabled={upsertBudget.isPending || !form.title}>
            {upsertBudget.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editId ? "Update Budget" : "Create Budget"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetView;

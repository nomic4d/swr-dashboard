import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, Plus, Pencil, Trash2, Building2, Tag, Layers, TrendingUp, DollarSign } from "lucide-react";
import { eventTheme } from "./CalendarView";

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;
const statusColor: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  frozen: "bg-blue-100 text-blue-700 border-blue-200",
  closed: "bg-zinc-100 text-zinc-700 border-zinc-200",
  archived: "bg-red-100 text-red-700 border-red-200",
};

const BudgetView = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = getPortalRole(user?.email, (user as any)?.user_metadata?.role);
  const isManager = role === "manager" || role === "admin";
  const isAdmin = role === "admin";

  const [budgetOpen, setBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("budgets")
        .select("*, budget_categories(name), events(title, event_number)")
        .order("created_at", { ascending: false });
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

  const totalAllocated = budgets.reduce((s: number, b: any) => s + Number(b.allocated_amount), 0);
  const totalSpent = budgets.reduce((s: number, b: any) => s + Number(b.spent_amount), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const usagePct = totalAllocated ? (totalSpent / totalAllocated) * 100 : 0;

  const statusGroups = ["pending", "approved", "draft", "frozen", "closed", "archived"];
  const grouped = statusGroups.reduce((acc: Record<string, any[]>, s) => {
    const items = budgets.filter((b: any) => b.status === s);
    if (items.length) acc[s] = items;
    return acc;
  }, {});

  const createBudget = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("budgets").insert({ ...data, created_by: user?.email });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget created"); setBudgetOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from("budgets").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget updated"); setBudgetOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const BudgetDialog = () => {
    const [title, setTitle] = useState(selectedBudget?.title ?? "");
    const [categoryId, setCategoryId] = useState(selectedBudget?.category_id ?? "");
    const [eventId, setEventId] = useState(selectedBudget?.event_id ?? "");
    const [department, setDepartment] = useState(selectedBudget?.department ?? "");
    const [allocatedAmount, setAllocatedAmount] = useState(selectedBudget?.allocated_amount ?? "");
    const [expectedCost, setExpectedCost] = useState(selectedBudget?.expected_cost ?? "");
    const [priority, setPriority] = useState(selectedBudget?.priority ?? "medium");
    const [fundingSource, setFundingSource] = useState(selectedBudget?.funding_source ?? "");
    const [description, setDescription] = useState(selectedBudget?.description ?? "");
    const [remarks, setRemarks] = useState(selectedBudget?.remarks ?? "");

    const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: async () => { const { data } = await supabase.from("events").select("id,title,event_number").order("event_number"); return data ?? []; } });

    const handleSubmit = () => {
      if (!title || !allocatedAmount) { toast.error("Title and amount are required"); return; }
      const payload = {
        title, category_id: categoryId || null, event_id: eventId || null,
        department: department || null,
        allocated_amount: Number(allocatedAmount), expected_cost: Number(expectedCost) || 0,
        priority, funding_source: fundingSource || null, description: description || null,
        remarks: remarks || null, status: "pending",
      };
      if (selectedBudget) {
        updateBudget.mutate({ id: selectedBudget.id, ...payload });
      } else {
        createBudget.mutate(payload);
      }
    };

    return (
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBudget ? "Edit Budget" : "Allocate Budget"}</DialogTitle>
            <DialogDescription>{selectedBudget ? "Update budget details" : "Create a new budget allocation"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Budget Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Orange Fest Budget" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Events" />
              </div>
              <div className="space-y-1.5">
                <Label>Event (optional)</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e: any) => <SelectItem key={e.id} value={e.id}>#{e.event_number} {e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Allocated Amount (PKR)</Label>
                <Input type="number" value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} placeholder="80000" />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Cost (PKR)</Label>
                <Input type="number" value={expectedCost} onChange={(e) => setExpectedCost(e.target.value)} placeholder="75000" />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Funding Source</Label>
                <Input value={fundingSource} onChange={(e) => setFundingSource(e.target.value)} placeholder="e.g. Annual Budget" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={createBudget.isPending || updateBudget.isPending}>
              {selectedBudget ? "Update Budget" : "Create Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Budgets</h2>
          <p className="text-sm text-muted-foreground">{budgets.length} budget{budgets.length !== 1 ? "s" : ""}</p>
        </div>
        {isManager && (
          <Button size="sm" onClick={() => { setSelectedBudget(null); setBudgetOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Allocate Budget
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Budget</p>
              <p className="text-lg font-bold">{fmt(totalAllocated)}</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: "100%" }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Consumed</p>
              <p className="text-lg font-bold">{fmt(totalSpent)}</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all" style={{ width: `${Math.min(usagePct, 100)}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">{usagePct.toFixed(1)}% of budget used</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-yellow-500 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold">{fmt(totalRemaining)}</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-yellow-400 transition-all" style={{ width: `${totalAllocated ? (totalRemaining / totalAllocated) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No budgets yet</p>
          <p className="text-sm mt-1">Click "Allocate Budget" to create the first one</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([status, items]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground capitalize">{status}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(items as any[]).map((b, i) => {
                  const pct = b.allocated_amount ? (Number(b.spent_amount) / Number(b.allocated_amount)) * 100 : 0;
                  const evNum = b.events?.event_number;
                  return (
                    <div key={b.id} className="relative rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className={`bg-gradient-to-br ${evNum && eventTheme[evNum] ? eventTheme[evNum].gradient : "from-gray-400 to-gray-600"} p-3 relative overflow-hidden`}>
                        <div className="absolute -right-4 -top-4 opacity-15">
                          {(() => { const Icon = evNum && eventTheme[evNum]?.icon || Wallet; return <Icon className="h-24 w-24 text-white" strokeWidth={1.2} />; })()}
                        </div>
                        <div className="relative flex items-center justify-between">
                          <div className={`p-1.5 rounded-lg bg-white/25 backdrop-blur-sm ring-2 ${evNum && eventTheme[evNum] ? eventTheme[evNum].ring : "ring-gray-400/40"}`}>
                            {(() => { const Icon = evNum && eventTheme[evNum]?.icon || Wallet; return <Icon className="h-4 w-4 text-white" strokeWidth={2.2} />; })()}
                          </div>
                          <div className="flex gap-1">
                            {isManager && (
                              <button onClick={() => { setSelectedBudget(b); setBudgetOpen(true); }} className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors">
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                            {isAdmin && (
                              <button onClick={() => { if (confirm("Delete this budget?")) deleteBudget.mutate(b.id); }} className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="relative flex items-center gap-2 mt-2">
                          <h3 className="text-sm font-bold text-white drop-shadow leading-tight flex-1">{b.title}</h3>
                          <Badge variant="outline" className={`text-[10px] h-5 px-1.5 border-white/30 text-white ${statusColor[b.status]}`}>{b.status}</Badge>
                        </div>
                        <div className="relative flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/80 mt-1">
                          {b.budget_categories?.name && (
                            <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {b.budget_categories.name}</span>
                          )}
                          {b.department && (
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {b.department}</span>
                          )}
                          {b.events?.title && (
                            <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> #{b.events.event_number} {b.events.title}</span>
                          )}
                        </div>
                      </div>
                      <div className="p-3 space-y-2 bg-card">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Spent <strong className="text-foreground">{fmt(Number(b.spent_amount))}</strong></span>
                          <span className="text-muted-foreground">of <strong className="text-foreground">{fmt(Number(b.allocated_amount))}</strong></span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-[11px]">
                          <span className={`font-medium ${pct >= 100 ? "text-destructive" : pct >= 80 ? "text-amber-600" : "text-emerald-600"}`}>
                            {pct.toFixed(1)}% used
                          </span>
                          {b.priority && <span className="capitalize text-muted-foreground">{b.priority} priority</span>}
                          {b.funding_source && <span className="text-muted-foreground">{b.funding_source}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <BudgetDialog />
    </div>
  );
};

export default BudgetView;

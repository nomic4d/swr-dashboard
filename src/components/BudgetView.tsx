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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Pencil, Trash2, Eye, Download,
  Plane, PartyPopper, Activity, Shield, Search, Filter, MoreHorizontal,
  CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Upload,
  Building2, User, Phone, Mail, MapPin, Hash, DollarSign,
  BarChart3, PieChart, LineChart, Calendar, DownloadCloud,
  Settings, Lock, Archive, Copy, Snowflake, Ban, CheckCheck,
  X, Loader2
} from "lucide-react";

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;
const statusColor: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  frozen: "bg-blue-100 text-blue-700 border-blue-200",
  closed: "bg-zinc-100 text-zinc-700 border-zinc-200",
  archived: "bg-red-100 text-red-700 border-red-200",
};
const prioColor: Record<string, string> = {
  low: "bg-slate-100 text-slate-600", medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700",
};
const expenseCategories = [
  "Transportation", "Hotel", "Food", "Refreshments", "Equipment",
  "Decoration", "Marketing", "Printing", "Entertainment", "Photography",
  "Fuel", "Medical", "Miscellaneous",
];

const BudgetView = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = getPortalRole(user?.email, (user as any)?.user_metadata?.role);
  const isManager = role === "manager" || role === "admin";
  const isAdmin = role === "admin";

  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialogs
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // ========== Queries ==========
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

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data } = await supabase.from("expenses").select("*, vendors(company_name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").order("company_name");
      return data ?? [];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id, title").order("title");
      return data ?? [];
    },
  });

  // ========== Computed ==========
  const totalAllocated = budgets.reduce((s, b) => s + Number(b.allocated_amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent_amount), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const usagePct = totalAllocated ? (totalSpent / totalAllocated) * 100 : 0;
  const pendingBudgets = budgets.filter((b) => b.status === "pending").length;
  const approvedBudgets = budgets.filter((b) => b.status === "approved").length;

  const filteredBudgets = budgets.filter((b) => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (categoryFilter !== "all" && b.category_id !== categoryFilter) return false;
    return true;
  });

  const budgetExpenses = (budgetId: string) => expenses.filter((e) => e.budget_id === budgetId);
  const budgetUsed = (budgetId: string) => {
    const b = budgets.find((x) => x.id === budgetId);
    if (!b || !b.allocated_amount) return 0;
    return (Number(b.spent_amount) / Number(b.allocated_amount)) * 100;
  };

  // ========== Mutations ==========
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
      const old = budgets.find((b) => b.id === id);
      const { error } = await supabase.from("budgets").update(data).eq("id", id);
      if (error) throw error;
      if (old) {
        for (const key of Object.keys(data)) {
          if (String(old[key]) !== String(data[key])) {
            await supabase.from("budget_audit_logs").insert({
              budget_id: id, action: "update", field_name: key,
              old_value: String(old[key] ?? ""), new_value: String(data[key] ?? ""),
              performed_by: user?.email,
            });
          }
        }
      }
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

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("expenses").insert(data);
      if (error) throw error;
      const b = budgets.find((x) => x.id === data.budget_id);
      if (b) {
        const newSpent = Number(b.spent_amount) + Number(data.amount);
        await supabase.from("budgets").update({ spent_amount: newSpent }).eq("id", data.budget_id);
        const pct = (newSpent / Number(b.allocated_amount)) * 100;
        if (pct >= 80) {
          await supabase.from("budget_notifications").insert({
            budget_id: data.budget_id, message: `Budget "${b.title}" is ${pct.toFixed(0)}% used`,
            type: pct >= 100 ? "error" : "warning",
          });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); queryClient.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Expense added"); setExpenseOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createVendor = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("vendors").insert(data);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vendors"] }); toast.success("Vendor added"); setVendorOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ========== Dialogs ==========
  const BudgetDialog = () => {
    const [title, setTitle] = useState(selectedBudget?.title ?? "");
    const [categoryId, setCategoryId] = useState(selectedBudget?.category_id ?? "");
    const [eventId, setEventId] = useState(selectedBudget?.event_id ?? "");
    const [campaignId, setCampaignId] = useState(selectedBudget?.campaign_id ?? "");
    const [department, setDepartment] = useState(selectedBudget?.department ?? "");
    const [allocatedAmount, setAllocatedAmount] = useState(selectedBudget?.allocated_amount ?? "");
    const [expectedCost, setExpectedCost] = useState(selectedBudget?.expected_cost ?? "");
    const [priority, setPriority] = useState(selectedBudget?.priority ?? "medium");
    const [fundingSource, setFundingSource] = useState(selectedBudget?.funding_source ?? "");
    const [description, setDescription] = useState(selectedBudget?.description ?? "");
    const [remarks, setRemarks] = useState(selectedBudget?.remarks ?? "");

    const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: async () => { const { data } = await supabase.from("events").select("id,title,event_number").order("event_number"); return data ?? []; } });
    const { data: campaigns = [] } = useQuery({ queryKey: ["campaigns"], queryFn: async () => { const { data } = await supabase.from("campaigns").select("id,title").order("title"); return data ?? []; } });

    const handleSubmit = () => {
      if (!title || !allocatedAmount) { toast.error("Title and amount are required"); return; }
      const payload = {
        title, category_id: categoryId || null, event_id: eventId || null,
        campaign_id: campaignId || null, department: department || null,
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
                <Label>Campaign (optional)</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
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

  const ExpenseDialog = () => {
    const [title, setTitle] = useState("");
    const [expCategory, setExpCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [budgetId, setBudgetId] = useState("");
    const [vendorId, setVendorId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = () => {
      if (!title || !amount || !budgetId) { toast.error("Title, amount, and budget are required"); return; }
      createExpense.mutate({
        budget_id: budgetId, title, category: expCategory || "Miscellaneous",
        amount: Number(amount), vendor_id: vendorId || null,
        payment_method: paymentMethod || null, notes: notes || null,
        created_by: user?.email, status: "pending",
      });
    };

    return (
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new expense against a budget</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Select value={budgetId} onValueChange={setBudgetId}>
                <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                <SelectContent>
                  {budgets.filter((b) => b.status === "approved" || b.status === "pending").map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.title} ({fmt(b.allocated_amount)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expense Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Catering" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (PKR)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vendor (optional)</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="e.g. Bank Transfer" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={createExpense.isPending}>Add Expense</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const VendorDialog = () => {
    const [companyName, setCompanyName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [taxNumber, setTaxNumber] = useState("");
    const [bankDetails, setBankDetails] = useState("");

    const handleSubmit = () => {
      if (!companyName) { toast.error("Company name is required"); return; }
      createVendor.mutate({
        company_name: companyName, contact_person: contactPerson || null,
        phone: phone || null, email: email || null, address: address || null,
        tax_number: taxNumber || null, bank_details: bankDetails || null,
      });
    };

    return (
      <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
            <DialogDescription>Register a new vendor or supplier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Tax Number</Label>
                <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Bank Details</Label>
              <Textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={createVendor.isPending}>Add Vendor</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ========== Render ==========
  if (!isManager) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Budget Overview</h2>
            <p className="text-muted-foreground text-sm mt-1">Read-only view of budgets</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <p className="text-sm text-slate-100">Total Budget</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalAllocated)}</p>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-orange-500 to-rose-600 text-white">
            <p className="text-sm text-slate-100">Consumed</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalSpent)}</p>
            <p className="text-xs text-slate-100 mt-1">{usagePct.toFixed(1)}% used</p>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-600 to-yellow-500 text-white">
            <p className="text-sm text-slate-100">Remaining</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalRemaining)}</p>
          </div>
        </div>
        {budgets.map((b: any) => {
          const pct = b.allocated_amount ? (Number(b.spent_amount) / Number(b.allocated_amount)) * 100 : 0;
          return (
            <div key={b.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{b.title}</p>
                <Badge className={statusColor[b.status]}>{b.status}</Badge>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Spent {fmt(b.spent_amount)}</span>
                <span>Budget {fmt(b.allocated_amount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Budget Management</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage budgets, expenses, and vendors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setSelectedVendor(null); setVendorOpen(true); }} className="gap-2">
            <Building2 className="h-4 w-4" /> Vendor
          </Button>
          <Button variant="outline" onClick={() => { setSelectedExpense(null); setExpenseOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Expense
          </Button>
          <Button onClick={() => { setSelectedBudget(null); setBudgetOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Allocate Budget
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-5 bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-100">Total Budget</p>
              <p className="text-2xl font-bold mt-1">{fmt(totalAllocated)}</p>
              <p className="text-xs text-slate-100 mt-1">{budgets.length} budgets</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10"><Wallet className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-600 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-100">Consumed</p>
              <p className="text-2xl font-bold mt-1">{fmt(totalSpent)}</p>
              <p className="text-xs text-slate-100 mt-1">{usagePct.toFixed(1)}% of total</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10"><TrendingDown className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-600 via-lime-600 to-yellow-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-100">Remaining</p>
              <p className="text-2xl font-bold mt-1">{fmt(totalRemaining)}</p>
              <Progress value={usagePct} className="h-1.5 mt-2 bg-white/20" />
            </div>
            <div className="p-3 rounded-xl bg-white/10"><TrendingUp className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-100">Approved / Pending</p>
              <p className="text-2xl font-bold mt-1">{approvedBudgets} / {pendingBudgets}</p>
              <p className="text-xs text-slate-100 mt-1">{budgets.filter((b) => b.status === "frozen").length} frozen</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="budgets" className="gap-2"><Wallet className="h-4 w-4" /> Budgets</TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2"><FileText className="h-4 w-4" /> Expenses</TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2"><Building2 className="h-4 w-4" /> Vendors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Budget Status Distribution</h3>
              <div className="space-y-3">
                {["draft", "pending", "approved", "frozen", "closed", "archived"].map((s) => {
                  const count = budgets.filter((b) => b.status === s).length;
                  const pct = budgets.length ? (count / budgets.length) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <Badge className={`w-20 justify-center ${statusColor[s]}`}>{s}</Badge>
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-4">Top Budgets by Allocation</h3>
              <div className="space-y-3">
                {[...budgets].sort((a, b) => Number(b.allocated_amount) - Number(a.allocated_amount)).slice(0, 8).map((b: any) => {
                  const pct = b.allocated_amount ? (Number(b.spent_amount) / Number(b.allocated_amount)) * 100 : 0;
                  return (
                    <div key={b.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{b.title}</span>
                        <span className="text-muted-foreground">{fmt(b.allocated_amount)}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-4">Monthly Spending</h3>
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 12 }, (_, i) => {
                const monthExpenses = expenses.filter((e: any) => {
                  const d = new Date(e.created_at);
                  return d.getMonth() === i;
                });
                const total = monthExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
                const max = Math.max(...Array.from({ length: 12 }, (_, j) => {
                  return expenses.filter((e: any) => new Date(e.created_at).getMonth() === j).reduce((s: number, e: any) => s + Number(e.amount), 0);
                }), 1);
                const height = (total / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: `${Math.max(height, 2)}%`, minHeight: height > 0 ? '4px' : '0px' }} />
                    <span className="text-[10px] text-muted-foreground">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search budgets..." className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Budget</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No budgets found</TableCell></TableRow>
                )}
                {filteredBudgets.map((b: any) => {
                  const pct = budgetUsed(b.id);
                  const remaining = Number(b.allocated_amount) - Number(b.spent_amount);
                  return (
                    <TableRow key={b.id}>
                      <TableCell><p className="font-medium">{b.title}</p></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{b.budget_categories?.name || "-"}</span></TableCell>
                      <TableCell>{fmt(b.allocated_amount)}</TableCell>
                      <TableCell>{fmt(b.spent_amount)}</TableCell>
                      <TableCell className={remaining < 0 ? "text-red-600 font-medium" : ""}>{fmt(remaining)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor[b.status]}>{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedBudget(b); setBudgetOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBudget.mutate(b.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{expenses.length} total expenses</p>
            <Button size="sm" onClick={() => { setSelectedExpense(null); setExpenseOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses recorded</TableCell></TableRow>
                )}
                {expenses.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell><p className="font-medium">{e.title}</p></TableCell>
                    <TableCell><span className="text-sm">{e.category}</span></TableCell>
                    <TableCell className="font-medium">{fmt(e.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.payment_method || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        e.status === "paid" ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
                        e.status === "pending" ? "text-amber-600 border-amber-200 bg-amber-50" :
                        e.status === "cancelled" ? "text-red-600 border-red-200 bg-red-50" :
                        "text-zinc-600 border-zinc-200 bg-zinc-50"
                      }>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{vendors.length} vendors</p>
            <Button size="sm" onClick={() => { setSelectedVendor(null); setVendorOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v: any) => (
              <div key={v.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{v.company_name}</p>
                </div>
                {v.contact_person && <p className="text-sm text-muted-foreground flex items-center gap-2"><User className="h-3.5 w-3.5" />{v.contact_person}</p>}
                {v.phone && <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{v.phone}</p>}
                {v.email && <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{v.email}</p>}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BudgetDialog />
      <ExpenseDialog />
      <VendorDialog />
    </div>
  );
};

export default BudgetView;

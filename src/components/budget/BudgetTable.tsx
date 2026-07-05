import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye, Pencil, Wallet, PlusCircle, FileUp, FileText, Trash2,
  Search, MoreHorizontal, Download, CheckSquare, XSquare, Archive, ArrowUpDown,
} from "lucide-react";
import { BudgetAllocation, BudgetCategory, BUDGET_STATUSES, formatCurrency } from "@/data/budgetData";
import { cn } from "@/lib/utils";

interface Props {
  budgets: BudgetAllocation[];
  onView: (budget: BudgetAllocation) => void;
  onEdit: (budget: BudgetAllocation) => void;
  onAllocateFunds: (budget: BudgetAllocation) => void;
  onAddExpense: (budget: BudgetAllocation) => void;
  onUploadInvoice: (budget: BudgetAllocation) => void;
  onDelete: (id: string) => void;
  onBulkAction: (action: string, ids: string[]) => void;
  canEdit: boolean;
  canDelete: boolean;
}

type SortKey = "title" | "allocatedAmount" | "spent" | "status" | "createdAt";
type SortDir = "asc" | "desc";

export default function BudgetTable({
  budgets, onView, onEdit, onAllocateFunds, onAddExpense,
  onUploadInvoice, onDelete, onBulkAction, canEdit, canDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let result = [...budgets];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.event.toLowerCase().includes(q) ||
        b.budgetOwner.toLowerCase().includes(q) ||
        b.department.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") result = result.filter((b) => b.category === categoryFilter);
    if (statusFilter !== "all") result = result.filter((b) => b.status === statusFilter);
    result.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "title") return a.title.localeCompare(b.title) * mul;
      if (sortKey === "allocatedAmount") return (a.allocatedAmount - b.allocatedAmount) * mul;
      if (sortKey === "spent") return (a.spent - b.spent) * mul;
      if (sortKey === "createdAt") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() * mul;
      return 0;
    });
    return result;
  }, [budgets, search, categoryFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((b) => b.id)));
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Frozen: "bg-blue-100 text-blue-700 border-blue-200",
      Closed: "bg-slate-100 text-slate-600 border-slate-200",
      Archived: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${variants[status] || ""}`}>{status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search budgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-60"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {["Trips", "Events", "Campaigns", "CSR Activities", "Staff Welfare", "Sports Week", "Training"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {BUDGET_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => onBulkAction("approve", Array.from(selected))}>
              <CheckSquare className="h-4 w-4 mr-1" />Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onBulkAction("reject", Array.from(selected))}>
              <XSquare className="h-4 w-4 mr-1" />Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => onBulkAction("export", Array.from(selected))}>
              <Download className="h-4 w-4 mr-1" />Export
            </Button>
            {canDelete && (
              <Button size="sm" variant="destructive" onClick={() => onBulkAction("delete", Array.from(selected))}>
                <Trash2 className="h-4 w-4 mr-1" />Delete
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onBulkAction("archive", Array.from(selected))}>
              <Archive className="h-4 w-4 mr-1" />Archive
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                Budget Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
              </TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("allocatedAmount")}>
                Allocated <ArrowUpDown className="inline h-3 w-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("spent")}>
                Spent <ArrowUpDown className="inline h-3 w-3 ml-1" />
              </TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("createdAt")}>
                Created <ArrowUpDown className="inline h-3 w-3 ml-1" />
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">No budgets found</TableCell>
              </TableRow>
            )}
            {filtered.map((budget) => {
              const pct = budget.allocatedAmount > 0 ? (budget.spent / budget.allocatedAmount) * 100 : 0;
              const remaining = budget.allocatedAmount - budget.spent;
              return (
                <TableRow key={budget.id} className={cn(selected.has(budget.id) && "bg-muted/50")}>
                  <TableCell><Checkbox checked={selected.has(budget.id)} onCheckedChange={() => toggleSelect(budget.id)} /></TableCell>
                  <TableCell className="font-medium">{budget.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{budget.event}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{budget.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatCurrency(budget.allocatedAmount)}</TableCell>
                  <TableCell className="font-mono text-sm text-orange-600">{formatCurrency(budget.spent)}</TableCell>
                  <TableCell className={cn("font-mono text-sm", remaining > 0 ? "text-emerald-600" : "text-red-600")}>
                    {formatCurrency(remaining)}
                  </TableCell>
                  <TableCell className="text-sm">{budget.budgetOwner}</TableCell>
                  <TableCell>{statusBadge(budget.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(budget.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onView(budget)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                        {canEdit && <DropdownMenuItem onClick={() => onEdit(budget)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>}
                        {canEdit && <DropdownMenuItem onClick={() => onAllocateFunds(budget)}><Wallet className="h-4 w-4 mr-2" />Allocate Funds</DropdownMenuItem>}
                        {canEdit && <DropdownMenuItem onClick={() => onAddExpense(budget)}><PlusCircle className="h-4 w-4 mr-2" />Add Expense</DropdownMenuItem>}
                        {canEdit && <DropdownMenuItem onClick={() => onUploadInvoice(budget)}><FileUp className="h-4 w-4 mr-2" />Upload Invoice</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onBulkAction("report", [budget.id])}><FileText className="h-4 w-4 mr-2" />Reports</DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(budget.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {budgets.length} budgets
      </div>
    </div>
  );
}

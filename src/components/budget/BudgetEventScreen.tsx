import { useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pencil, PlusCircle, Snowflake, XCircle, Copy, Archive,
  ArrowUpCircle, ArrowDownCircle, Wallet,
} from "lucide-react";
import { BudgetAllocation, Expense, Invoice, formatCurrency } from "@/data/budgetData";
import ExpenseManagement from "./ExpenseManagement";
import InvoiceManagement from "./InvoiceManagement";
import BudgetTimeline from "./BudgetTimeline";
import { BudgetTimelineEntry } from "@/data/budgetData";

interface Props {
  budget: BudgetAllocation | null;
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
  invoices: Invoice[];
  timeline: BudgetTimelineEntry[];
  onEdit: (budget: BudgetAllocation) => void;
  onAddExpense: (budget: BudgetAllocation) => void;
  onAddExpenseSave: (expense: any) => void;
  onUpdateExpense: (id: string, updates: any) => void;
  onDeleteExpense: (id: string) => void;
  onUploadInvoice: (inv: any) => void;
  canEdit: boolean;
  canDelete: boolean;
  onAction: (action: string, budgetId: string) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Frozen: "bg-blue-100 text-blue-700",
    Closed: "bg-slate-100 text-slate-600",
    Archived: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded-full ${map[status] || ""}`}>
      {status}
    </span>
  );
};

const BudgetEventScreen = ({
  budget, open, onClose, expenses, invoices, timeline,
  onEdit, onAddExpense, onAddExpenseSave, onUpdateExpense, onDeleteExpense,
  onUploadInvoice, canEdit, canDelete, onAction,
}: Props) => {
  const pct = budget && budget.allocatedAmount > 0
    ? (budget.spent / budget.allocatedAmount) * 100 : 0;
  const remaining = budget ? budget.allocatedAmount - budget.spent : 0;

  const budgetExpenses = useMemo(
    () => expenses.filter((e) => e.budgetId === budget?.id),
    [expenses, budget?.id]
  );
  const budgetInvoices = useMemo(
    () => invoices.filter((i) => i.budgetId === budget?.id),
    [invoices, budget?.id]
  );
  const budgetTimeline = useMemo(
    () => timeline.filter((t) => t.budgetId === budget?.id),
    [timeline, budget?.id]
  );

  if (!budget) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-xl">{budget.title}</DialogTitle>
              <DialogDescription>Event budget details and controls</DialogDescription>
            </div>
            <StatusBadge status={budget.status} />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-sky-50 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(budget.allocatedAmount)}</p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-amber-50 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Spent</p>
            <p className="text-xl font-bold text-orange-700 mt-1">{formatCurrency(budget.spent)}</p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-green-50 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
            <p className={`text-xl font-bold mt-1 ${remaining > 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{pct.toFixed(1)}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { onEdit(budget); onClose(); }}>
              <Pencil className="h-4 w-4 mr-1" />Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("increase", budget.id)}>
              <ArrowUpCircle className="h-4 w-4 mr-1" />Increase Budget
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("reduce", budget.id)}>
              <ArrowDownCircle className="h-4 w-4 mr-1" />Reduce Budget
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("freeze", budget.id)}>
              <Snowflake className="h-4 w-4 mr-1" />Freeze Budget
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("close", budget.id)}>
              <XCircle className="h-4 w-4 mr-1" />Close Budget
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("duplicate", budget.id)}>
              <Copy className="h-4 w-4 mr-1" />Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("archive", budget.id)}>
              <Archive className="h-4 w-4 mr-1" />Archive
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onAddExpense(budget); onClose(); }}>
              <PlusCircle className="h-4 w-4 mr-1" />Add Expense
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("release_funds", budget.id)}>
              <Wallet className="h-4 w-4 mr-1" />Release Funds
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            ["Category", budget.category],
            ["Event", budget.event],
            ["Campaign", budget.campaign],
            ["Department", budget.department],
            ["Manager", budget.budgetOwner],
            ["Priority", budget.priority],
            ["Source", budget.fundingSource],
            ["Year", String(budget.budgetYear)],
            ["Expected Cost", formatCurrency(budget.expectedCost)],
            ["Created", new Date(budget.createdAt).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
              <p className="font-medium truncate">{value}</p>
            </div>
          ))}
        </div>

        {budget.description && (
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            <p className="font-medium text-foreground mb-1">Description</p>
            <p>{budget.description}</p>
          </div>
        )}

        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses">Expenses ({budgetExpenses.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({budgetInvoices.length})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline ({budgetTimeline.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="expenses">
            <ExpenseManagement
              expenses={budgetExpenses}
              budgets={[budget]}
              budgetId={budget.id}
              onAdd={onAddExpenseSave}
              onUpdate={onUpdateExpense}
              onDelete={onDeleteExpense}
              canEdit={canEdit}
            />
          </TabsContent>
          <TabsContent value="invoices">
            <InvoiceManagement
              invoices={budgetInvoices}
              budgets={[budget]}
              budgetId={budget.id}
              onUpload={onUploadInvoice}
              canEdit={canEdit}
            />
          </TabsContent>
          <TabsContent value="timeline">
            <BudgetTimeline timeline={budgetTimeline} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetEventScreen;

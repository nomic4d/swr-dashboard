import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, FileText,
} from "lucide-react";
import {
  Expense, ExpenseCategory, EXPENSE_CATEGORIES, PAYMENT_STATUSES,
  BudgetAllocation, formatCurrency,
} from "@/data/budgetData";

interface Props {
  expenses: Expense[];
  budgets: BudgetAllocation[];
  budgetId?: string;
  onAdd: (expense: Omit<Expense, "id" | "createdAt">) => void;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

type ExpenseForm = Omit<Expense, "id" | "createdAt">;

const defaultForm: ExpenseForm = {
  budgetId: "", title: "", category: "Miscellaneous", expenseDate: new Date().toISOString().split("T")[0],
  event: "", vendor: "", vendorId: "", amount: 0, paymentMethod: "Cash",
  invoiceNumber: "", receiptUrl: "", attachmentUrl: "", notes: "",
  status: "Pending", createdBy: "",
};

export default function ExpenseManagement({ expenses, budgets, budgetId, onAdd, onUpdate, onDelete, canEdit }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(defaultForm);

  const filteredExpenses = budgetId ? expenses.filter((e) => e.budgetId === budgetId) : expenses;

  const openAdd = (bId?: string) => {
    setEditing(null);
    setForm({ ...defaultForm, budgetId: bId || (budgets[0]?.id || ""), expenseDate: new Date().toISOString().split("T")[0] });
    setOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      budgetId: expense.budgetId, title: expense.title, category: expense.category,
      expenseDate: expense.expenseDate.split("T")[0], event: expense.event, vendor: expense.vendor,
      vendorId: expense.vendorId || "", amount: expense.amount, paymentMethod: expense.paymentMethod,
      invoiceNumber: expense.invoiceNumber, receiptUrl: expense.receiptUrl,
      attachmentUrl: expense.attachmentUrl, notes: expense.notes, status: expense.status,
      createdBy: expense.createdBy,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      onUpdate(editing.id, { ...form, amount: Number(form.amount) });
    } else {
      onAdd({ ...form, amount: Number(form.amount) });
    }
    setOpen(false);
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      Paid: "bg-emerald-100 text-emerald-700", Pending: "bg-amber-100 text-amber-700",
      Overdue: "bg-red-100 text-red-700", Cancelled: "bg-slate-100 text-slate-600",
      Refunded: "bg-blue-100 text-blue-700",
    };
    return map[s] || "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Expenses {budgetId && `for ${budgets.find((b) => b.id === budgetId)?.title || ""}`}</h3>
        {canEdit && (
          <Button size="sm" onClick={() => openAdd(budgetId)}>
            <Plus className="h-4 w-4 mr-1" />Add Expense
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              {!budgetId && <TableHead>Budget</TableHead>}
              {canEdit && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="text-center text-muted-foreground py-6">No expenses recorded</TableCell>
              </TableRow>
            )}
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.title}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{expense.category}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-sm">{expense.vendor}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(expense.amount)}</TableCell>
                <TableCell><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(expense.status)}`}>{expense.status}</span></TableCell>
                {!budgetId && (
                  <TableCell className="text-sm text-muted-foreground">
                    {budgets.find((b) => b.id === expense.budgetId)?.title || "-"}
                  </TableCell>
                )}
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(expense)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(expense.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>Fill in the expense details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expense Title</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.expenseDate} onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Event</Label>
                <Input value={form.event} onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Amount (PKR)</Label>
                <Input type="number" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} required />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Cash", "Bank Transfer", "Cheque", "Credit Card", "Online Payment"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Update" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

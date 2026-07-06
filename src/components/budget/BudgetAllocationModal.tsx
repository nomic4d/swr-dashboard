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
import { Switch } from "@/components/ui/switch";
import {
  BudgetAllocation, BUDGET_CATEGORIES, PRIORITIES, FUNDING_SOURCES,
} from "@/data/budgetData";

type BudgetForm = Omit<BudgetAllocation, "id" | "spent" | "createdAt" | "updatedAt">;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: BudgetForm) => void;
  initialData?: BudgetAllocation | null;
  managers: { id: string; name: string }[];
}

function initForm(initialData: BudgetAllocation | null | undefined): BudgetForm {
  if (initialData) {
    const { id, spent, createdAt, updatedAt, ...rest } = initialData;
    return rest;
  }
  return {
    title: "", category: "Events", event: "", campaign: "", department: "",
    budgetYear: 2026, allocatedAmount: 0, expectedCost: 0, currency: "PKR",
    fundingSource: "Internal", budgetOwner: "", approvalRequired: false,
    priority: "Medium", description: "", remarks: "", status: "Active",
    managerId: "", managerName: "",
  };
}

export default function BudgetAllocationModal({ open, onClose, onSave, initialData, managers }: Props) {
  const [form, setForm] = useState<BudgetForm>(() => initForm(initialData));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, allocatedAmount: Number(form.allocatedAmount), expectedCost: Number(form.expectedCost) });
    onClose();
  };

  const update = (key: keyof BudgetForm, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg !gap-2 !p-4">
        <DialogHeader>
          <DialogTitle className="text-base">{initialData ? "Edit Budget" : "Allocate Budget"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label className="text-xs">Title</Label>
              <Input className="h-7 text-xs" value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Event</Label>
              <Input className="h-7 text-xs" value={form.event} onChange={(e) => update("event", e.target.value)} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Campaign</Label>
              <Input className="h-7 text-xs" value={form.campaign} onChange={(e) => update("campaign", e.target.value)} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Department</Label>
              <Input className="h-7 text-xs" value={form.department} onChange={(e) => update("department", e.target.value)} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Year</Label>
              <Input className="h-7 text-xs" type="number" value={form.budgetYear} onChange={(e) => update("budgetYear", Number(e.target.value))} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Amount (PKR)</Label>
              <Input className="h-7 text-xs" type="number" value={form.allocatedAmount || ""} onChange={(e) => update("allocatedAmount", Number(e.target.value))} required />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Expected Cost</Label>
              <Input className="h-7 text-xs" type="number" value={form.expectedCost || ""} onChange={(e) => update("expectedCost", Number(e.target.value))} />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Funding Source</Label>
              <Select value={form.fundingSource} onValueChange={(v) => update("fundingSource", v as any)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUNDING_SOURCES.map((fs) => <SelectItem key={fs} value={fs}>{fs}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Owner</Label>
              <Select value={form.budgetOwner} onValueChange={(v) => update("budgetOwner", v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {managers.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v as any)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 pt-2">
              <Switch checked={form.approvalRequired} onCheckedChange={(v) => update("approvalRequired", v)} id="approval" className="scale-75" />
              <Label htmlFor="approval" className="text-xs">Approval Required</Label>
            </div>
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs">Description</Label>
            <Textarea className="text-xs min-h-[0]" value={form.description} onChange={(e) => update("description", e.target.value)} rows={1} />
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs">Remarks</Label>
            <Textarea className="text-xs min-h-[0]" value={form.remarks} onChange={(e) => update("remarks", e.target.value)} rows={1} />
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm">{initialData ? "Update" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

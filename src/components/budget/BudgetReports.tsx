import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Printer } from "lucide-react";
import { BudgetAllocation, formatCurrency } from "@/data/budgetData";
import { toast } from "sonner";

interface Props {
  budgets: BudgetAllocation[];
}

const reportTypes = [
  { id: "annual", label: "Annual Report" },
  { id: "monthly", label: "Monthly Report" },
  { id: "quarterly", label: "Quarterly Report" },
  { id: "department", label: "Department Report" },
  { id: "campaign", label: "Campaign Report" },
  { id: "trip", label: "Trip Report" },
  { id: "event", label: "Event Report" },
  { id: "expense", label: "Expense Report" },
  { id: "vendor", label: "Vendor Report" },
  { id: "utilization", label: "Budget Utilization Report" },
];

const downloadFormats = ["PDF", "Excel", "CSV", "Print"] as const;

const BudgetReports = ({ budgets }: Props) => {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("annual");
  const [format, setFormat] = useState("PDF");

  const handleGenerate = () => {
    toast.success(`${reportType.replace("_", " ")} report generated as ${format}`);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4 mr-1" />Generate Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>Choose report type and format.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Report Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {reportTypes.map((rt) => (
                  <button
                    key={rt.id}
                    type="button"
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                      reportType === rt.id
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setReportType(rt.id)}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Download Format</Label>
              <RadioGroup value={format} onValueChange={setFormat} className="flex gap-4">
                {downloadFormats.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <RadioGroupItem value={f} id={f} />
                    <Label htmlFor={f}>{f}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Summary</p>
              <p>Total Budgets: {budgets.length}</p>
              <p>Total Allocated: {formatCurrency(budgets.reduce((s, b) => s + b.allocatedAmount, 0))}</p>
              <p>Total Spent: {formatCurrency(budgets.reduce((s, b) => s + b.spent, 0))}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate}>
              <Download className="h-4 w-4 mr-1" />Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BudgetReports;

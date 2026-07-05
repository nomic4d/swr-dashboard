import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, AlertCircle, XCircle, RotateCcw,
} from "lucide-react";
import { PaymentRecord, formatCurrency } from "@/data/budgetData";

interface Props {
  payments: PaymentRecord[];
}

const statusConfig: Record<string, { icon: React.ElementType; className: string }> = {
  Paid: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  Pending: { icon: Clock, className: "bg-amber-100 text-amber-700" },
  Overdue: { icon: AlertCircle, className: "bg-red-100 text-red-700" },
  Cancelled: { icon: XCircle, className: "bg-slate-100 text-slate-600" },
  Refunded: { icon: RotateCcw, className: "bg-blue-100 text-blue-700" },
};

const PaymentTracking = ({ payments }: Props) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-card/50">
        No payment records
      </div>
    );
  }

  const counts = {
    Paid: payments.filter((p) => p.status === "Paid").length,
    Pending: payments.filter((p) => p.status === "Pending").length,
    Overdue: payments.filter((p) => p.status === "Overdue").length,
    Cancelled: payments.filter((p) => p.status === "Cancelled").length,
    Refunded: payments.filter((p) => p.status === "Refunded").length,
  };

  const totalPaid = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalDue = payments.filter((p) => p.status === "Pending" || p.status === "Overdue").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {Object.entries(counts).map(([status, count]) => {
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          return (
            <div key={status} className="rounded-lg border p-3 text-center">
              <Icon className={`h-4 w-4 mx-auto mb-1 ${cfg.className.split(" ")[1]}`} />
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] uppercase text-muted-foreground">{status}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-sm">
        <div className="rounded-lg border p-3 flex-1">
          <p className="text-muted-foreground text-xs">Total Paid</p>
          <p className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-lg border p-3 flex-1">
          <p className="text-muted-foreground text-xs">Total Due</p>
          <p className="font-bold text-red-600">{formatCurrency(totalDue)}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => {
              const cfg = statusConfig[p.status];
              const Icon = cfg.icon;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.vendorName}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(p.amount)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.className}`}>
                      <Icon className="h-3 w-3" />{p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{p.notes || "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentTracking;

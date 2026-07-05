import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldAlert } from "lucide-react";
import { AuditLog } from "@/data/budgetData";

interface Props {
  logs: AuditLog[];
}

const actionColors: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-700",
  edited: "bg-amber-100 text-amber-700",
  deleted: "bg-red-100 text-red-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-rose-100 text-rose-700",
  restored: "bg-blue-100 text-blue-700",
  locked: "bg-slate-100 text-slate-700",
  funds_released: "bg-cyan-100 text-cyan-700",
  expense_added: "bg-orange-100 text-orange-700",
  invoice_uploaded: "bg-purple-100 text-purple-700",
};

const formatAction = (action: string) =>
  action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const AuditLogs = ({ logs }: Props) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          l.performedBy.toLowerCase().includes(search.toLowerCase()) ||
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          l.remarks.toLowerCase().includes(search.toLowerCase()),
      ),
    [logs, search],
  );

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-card/50">No audit logs</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Audit Logs
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Old Value</TableHead>
              <TableHead>New Value</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${actionColors[log.action] || "bg-slate-100 text-slate-600"}`}>
                    {formatAction(log.action)}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-sm">{log.performedBy}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{log.performedByRole}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{log.oldValue || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{log.newValue || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{log.ipAddress}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{log.remarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AuditLogs;

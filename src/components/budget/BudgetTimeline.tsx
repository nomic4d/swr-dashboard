import { CheckCircle2, Clock, DollarSign, FileUp, PlusCircle, Pencil, Snowflake, Archive } from "lucide-react";
import { BudgetTimelineEntry } from "@/data/budgetData";

interface Props {
  timeline: BudgetTimelineEntry[];
  budgetId?: string;
}

const actionIcons: Record<string, React.ElementType> = {
  "Budget Created": PlusCircle,
  "Budget Approved": CheckCircle2,
  "Funds Released": DollarSign,
  "Expenses Added": FileUp,
  "Invoices Uploaded": FileUp,
  "Budget Edited": Pencil,
  "Budget Frozen": Snowflake,
  "Budget Closed": Archive,
};

const actionColors: Record<string, string> = {
  "Budget Created": "bg-blue-100 text-blue-700",
  "Budget Approved": "bg-emerald-100 text-emerald-700",
  "Funds Released": "bg-green-100 text-green-700",
  "Expenses Added": "bg-orange-100 text-orange-700",
  "Invoices Uploaded": "bg-purple-100 text-purple-700",
  "Budget Edited": "bg-amber-100 text-amber-700",
  "Budget Frozen": "bg-sky-100 text-sky-700",
  "Budget Closed": "bg-slate-100 text-slate-700",
};

const formatDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const BudgetTimeline = ({ timeline, budgetId }: Props) => {
  const filtered = budgetId ? timeline.filter((t) => t.budgetId === budgetId) : timeline;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-card/50">
        No timeline entries yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Budget Timeline</h3>
      <div className="space-y-0">
        {filtered.map((entry, i) => {
          const Icon = actionIcons[entry.action] || Clock;
          const color = actionColors[entry.action] || "bg-slate-100 text-slate-700";
          return (
            <div key={entry.id} className="flex gap-4 pb-6 relative">
              {i < filtered.length - 1 && (
                <div className="absolute left-[17px] top-9 bottom-0 w-px bg-border" />
              )}
              <div className={`p-2 rounded-full ${color} shrink-0 z-10`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{entry.action}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(entry.timestamp)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">by {entry.performedBy}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetTimeline;

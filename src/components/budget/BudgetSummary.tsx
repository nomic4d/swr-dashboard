import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingDown, TrendingUp, CalendarRange } from "lucide-react";
import { BudgetAllocation, formatCurrency } from "@/data/budgetData";

interface Props {
  budgets: BudgetAllocation[];
}

const BudgetSummary = ({ budgets }: Props) => {
  const totals = useMemo(() => {
    const totalAllocated = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    return { totalAllocated, totalSpent, remaining: totalAllocated - totalSpent, pct: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0 };
  }, [budgets]);

  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Budget Summary</h2>
        <p className="text-muted-foreground text-sm mt-1">Overview of all budgets (read-only)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 border text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Total Budget</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totals.totalAllocated)}</p>
              <p className="text-xs text-white/70 mt-1">{budgets.length} active budgets</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10"><Wallet className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-600 border text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Consumed</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totals.totalSpent)}</p>
              <p className="text-xs text-white/70 mt-1">{totals.pct.toFixed(1)}% of total</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10"><TrendingDown className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-600 via-lime-600 to-yellow-500 border text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Remaining</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totals.remaining)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10"><TrendingUp className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Activity Budgets</h3>
        </div>
        <div className="divide-y">
          {budgets.map((b) => {
            const pct = b.allocatedAmount > 0 ? (b.spent / b.allocatedAmount) * 100 : 0;
            const catIcons: Record<string, string> = {
              Trips: "🌍", Events: "🎉", Campaigns: "📢", "CSR Activities": "🤝",
              "Staff Welfare": "💼", "Office Events": "🏢", "Sports Week": "🏃",
              Training: "📚", Workshops: "🔧", Conferences: "🎤", "Emergency Activities": "🚨",
              "Community Programs": "🏘️", Donations: "❤️", "Volunteer Activities": "🙋",
            };
            return (
              <div key={b.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{catIcons[b.category] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{b.title}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{b.category}</Badge>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Spent: {formatCurrency(b.spent)}</span>
                      <span>Budget: {formatCurrency(b.allocatedAmount)}</span>
                      <span className={pct >= 80 ? "text-orange-600 font-medium" : ""}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;

import { useMemo } from "react";
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, PiggyBank,
  CheckCircle, Clock, Shield, BookOpen, Users, FileText, DollarSign,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BudgetAllocation, formatCurrency } from "@/data/budgetData";

interface BudgetDashboardProps {
  budgets: BudgetAllocation[];
  totals: {
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    pctUsed: number;
    activeBudgets: number;
    pendingApproval: number;
    totalEvents: number;
    totalVendors: number;
    paidInvoices: number;
    pendingPayments: number;
  };
}

const BudgetDashboard = ({ budgets, totals }: BudgetDashboardProps) => {
  const urgentBudgets = useMemo(
    () => budgets.filter((b) => b.allocatedAmount > 0 && (b.spent / b.allocatedAmount) * 100 >= 80),
    [budgets]
  );

  const monthlyAvg = useMemo(
    () => (totals.totalSpent / 7).toFixed(0),
    [totals.totalSpent]
  );

  const projectedRemaining = useMemo(
    () => Math.max(0, totals.totalRemaining - Number(monthlyAvg) * 5),
    [totals.totalRemaining, monthlyAvg]
  );

  const cards = [
    {
      label: "Total Budget", value: formatCurrency(totals.totalAllocated),
      sub: `${totals.totalEvents} Events · Annual Budget`,
      icon: Wallet, gradient: "from-blue-600 via-sky-600 to-cyan-500",
    },
    {
      label: "Consumed", value: formatCurrency(totals.totalSpent),
      sub: `${totals.pctUsed.toFixed(1)}% Used · Monthly: PKR ${Number(monthlyAvg).toLocaleString()}`,
      icon: TrendingDown, gradient: "from-orange-500 via-amber-500 to-rose-600",
    },
    {
      label: "Remaining Budget", value: formatCurrency(totals.totalRemaining),
      sub: `Projected: ${formatCurrency(projectedRemaining)} · Available`,
      icon: TrendingUp, gradient: "from-emerald-600 via-lime-600 to-yellow-500",
    },
    {
      label: "Approved Budget", value: totals.activeBudgets.toString(),
      sub: "Active budgets", icon: CheckCircle, gradient: "from-green-600 via-emerald-500 to-teal-400",
    },
    {
      label: "Pending Approval", value: totals.pendingApproval.toString(),
      sub: "Awaiting review", icon: Clock, gradient: "from-yellow-500 via-amber-500 to-orange-500",
    },
    {
      label: "Emergency Fund", value: formatCurrency(500000),
      sub: "Reserved", icon: Shield, gradient: "from-red-600 via-rose-500 to-pink-500",
    },
    {
      label: "Expected Expenses", value: formatCurrency(
        budgets.reduce((s, b) => s + (b.expectedCost - b.allocatedAmount > 0 ? b.expectedCost - b.allocatedAmount : 0), 0)
      ),
      sub: "Upcoming costs", icon: DollarSign, gradient: "from-purple-600 via-violet-500 to-indigo-400",
    },
    {
      label: "Total Vendors", value: totals.totalVendors.toString(),
      sub: `${totals.paidInvoices} Paid · ${totals.pendingPayments} Pending`,
      icon: Users, gradient: "from-cyan-600 via-blue-500 to-indigo-500",
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl p-5 bg-gradient-to-br ${card.gradient} border shadow-xl text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-white/80">{card.label}</p>
                  <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
                  <p className="text-xs text-white/70 mt-1 truncate">{card.sub}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/10 shrink-0 ml-3">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {urgentBudgets.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Budgets exceeding 80%</h3>
          </div>
          <div className="space-y-2">
            {urgentBudgets.map((b) => {
              const pct = (b.spent / b.allocatedAmount) * 100;
              return (
                <div key={b.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{b.title}</p>
                    <Progress value={pct} className="h-1.5 mt-1 bg-red-200" indicatorClass={pct >= 90 ? "bg-red-600" : "bg-orange-500"} />
                  </div>
                  <span className={`ml-3 text-sm font-bold ${pct >= 90 ? "text-red-600" : "text-orange-600"}`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600"><BookOpen className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Budget Summary</h3>
            <p className="text-xs text-muted-foreground">Overall financial overview</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/80 border border-blue-100">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Allocated</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(totals.totalAllocated)}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/80 border border-orange-100">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Spent</p>
            <p className="text-xl font-bold text-orange-700 mt-1">{formatCurrency(totals.totalSpent)}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/80 border border-emerald-100">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totals.totalRemaining)}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{totals.pctUsed.toFixed(1)}%</span>
          </div>
          <Progress value={totals.pctUsed} className="h-3" />
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;

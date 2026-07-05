import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  MONTHLY_SPENDING_DATA, DEPARTMENT_SPENDING, CATEGORY_BREAKDOWN,
  QUARTERLY_DATA, ANNUAL_DATA, BudgetAllocation, formatCurrency,
} from "@/data/budgetData";

const COLORS = [
  "#3b82f6", "#f97316", "#22c55e", "#ef4444", "#a855f7",
  "#06b6d4", "#eab308", "#ec4899", "#14b8a6", "#f59e0b",
  "#6366f1", "#84cc16", "#d946ef", "#0ea5e9",
];

interface BudgetChartsProps {
  budgets: BudgetAllocation[];
}

const BudgetCharts = ({ budgets }: BudgetChartsProps) => {
  const topSpendingEvents = budgets
    .filter((b) => b.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
    .map((b) => ({ name: b.title, spent: b.spent, budget: b.allocatedAmount }));

  const remainingBudgetData = budgets
    .filter((b) => b.allocatedAmount > 0)
    .map((b) => ({
      name: b.title,
      remaining: b.allocatedAmount - b.spent,
      percentage: ((b.allocatedAmount - b.spent) / b.allocatedAmount * 100).toFixed(1),
    }))
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Monthly Spending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MONTHLY_SPENDING_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend />
              <Bar dataKey="budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Budgeted" />
              <Bar dataKey="actual" fill="#f97316" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Department Spending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={DEPARTMENT_SPENDING} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend />
              <Bar dataKey="budget" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Budget" />
              <Bar dataKey="spent" fill="#f97316" radius={[0, 4, 4, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={CATEGORY_BREAKDOWN}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {CATEGORY_BREAKDOWN.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Quarterly Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={QUARTERLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend />
              <Line type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Budget" />
              <Line type="monotone" dataKey="spent" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="Spent" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Top Spending Events</h3>
          {topSpendingEvents.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSpendingEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend />
                <Bar dataKey="budget" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="spent" fill="#f97316" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No spending data yet</p>
          )}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Annual Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ANNUAL_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend />
              <Bar dataKey="budget" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Budget" />
              <Bar dataKey="spent" fill="#22c55e" radius={[4, 4, 0, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Remaining Budget by Event</h3>
        <div className="space-y-3">
          {remainingBudgetData.slice(0, 8).map((item) => (
            <div key={item.name} className="flex items-center gap-4">
              <span className="text-sm font-medium w-40 truncate">{item.name}</span>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, Number(item.percentage))}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-emerald-600 w-28 text-right">{formatCurrency(item.remaining)}</span>
              <span className="text-xs text-muted-foreground w-12 text-right">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetCharts;

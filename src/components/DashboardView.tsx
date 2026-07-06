import { useMemo } from "react";
import { Calendar, CalendarDays, Users, MessageSquare, Clock, Wallet, HandHeart, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isFuture } from "date-fns";
import { Progress } from "@/components/ui/progress";

const DashboardView = () => {
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reminders").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: budgetRows = [] } = useQuery({
    queryKey: ["dashboard-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("allocated_amount, spent_amount");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ["dashboard-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contributions").select("contributor_name, amount").order("amount", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const budgetTotals = useMemo(() => {
    const allocated = budgetRows.reduce((s: number, b: any) => s + Number(b.allocated_amount || 0), 0);
    const consumed = budgetRows.reduce((s: number, b: any) => s + Number(b.spent_amount || 0), 0);
    return { allocated, consumed, remaining: allocated - consumed, pct: allocated > 0 ? (consumed / allocated) * 100 : 0 };
  }, [budgetRows]);

  const topDonors = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contributions) {
      const name = c.contributor_name.trim();
      map.set(name, (map.get(name) || 0) + Number(c.amount));
    }
    return Array.from(map.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [contributions]);

  const donorTotal = topDonors.reduce((s, d) => s + d.total, 0);

  const upcomingEvents = events.filter(e => e.event_date && isFuture(new Date(e.event_date)));
  const pendingReminders = reminders.filter(r => r.status === "pending");

  const stats = [
    {
      label: "Total Events",
      value: events.length,
      icon: Calendar,
      card: "bg-blue-300 border border-blue-400 text-slate-950",
      iconBg: "bg-blue-700/10 text-blue-900",
      labelText: "text-slate-800",
    },
    {
      label: "Upcoming",
      value: upcomingEvents.length,
      icon: Clock,
      card: "bg-sky-300 border border-sky-400 text-slate-950",
      iconBg: "bg-sky-700/10 text-sky-900",
      labelText: "text-slate-800",
    },
    {
      label: "Staff Members",
      value: staff.length,
      icon: Users,
      card: "bg-emerald-300 border border-emerald-400 text-slate-950",
      iconBg: "bg-emerald-700/10 text-emerald-900",
      labelText: "text-slate-800",
    },
    {
      label: "Pending Reminders",
      value: pendingReminders.length,
      icon: MessageSquare,
      card: "bg-orange-300 border border-orange-400 text-slate-950",
      iconBg: "bg-orange-700/10 text-orange-900",
      labelText: "text-slate-800",
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">SWR Yearly Calendar 2026 Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.card} rounded-xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-medium ${stat.labelText}`}>{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.iconBg} p-3 rounded-xl shadow-sm`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Events - spans 2 columns */}
        <div className="lg:col-span-2 glass-card rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-100 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-950 truncate">{event.title}</p>
                  <p className="text-xs text-slate-500">{event.month} · {event.location}</p>
                </div>
                {event.event_date && (
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {format(new Date(event.event_date), "MMM d")}
                  </span>
                )}
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Activity Rules</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
              <p className="text-sm font-medium text-foreground">📋 Staff Eligibility</p>
              <p className="text-xs text-muted-foreground mt-1">Only staff is eligible for events</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
              <p className="text-sm font-medium text-foreground">📊 Attendance Requirement</p>
              <p className="text-xs text-muted-foreground mt-1">Attending 70% is mandatory</p>
            </div>
            <div className="p-4 rounded-lg bg-success/5 border border-success/10">
              <p className="text-sm font-medium text-foreground">🤝 Motto</p>
              <p className="text-xs text-muted-foreground mt-1">Cooperation makes life memorable</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget + Donors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget card - spans 2 */}
        <div className="lg:col-span-2 glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600"><Wallet className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground">SWR Budget 2026</h3>
                <p className="text-xs text-muted-foreground">Allocated vs consumed</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{budgetTotals.pct.toFixed(1)}% used</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground mt-1">PKR {budgetTotals.allocated.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Consumed</p>
              <p className="text-lg font-bold text-orange-600 mt-1">PKR {budgetTotals.consumed.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">PKR {budgetTotals.remaining.toLocaleString()}</p>
            </div>
          </div>
          <Progress value={budgetTotals.pct} className="h-2.5" />
        </div>

        {/* Donor card */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-600"><HandHeart className="h-5 w-5" /></div>
            <div>
              <h3 className="font-semibold text-foreground">Top Donors</h3>
              <p className="text-xs text-muted-foreground">PKR {donorTotal.toLocaleString()} contributed</p>
            </div>
          </div>
          <div className="space-y-2">
            {topDonors.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full ${i === 0 ? "bg-yellow-500/20 text-yellow-600" : i === 1 ? "bg-slate-400/20 text-slate-500" : i === 2 ? "bg-amber-700/20 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                  {i < 3 ? <Medal className="h-3.5 w-3.5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">PKR {d.total.toLocaleString()}</p>
                </div>
                <p className="text-sm font-bold text-pink-600">PKR {d.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

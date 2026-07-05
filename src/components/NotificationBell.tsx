import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const NotificationBell = () => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [toasted, setToasted] = useState<Set<string>>(new Set());

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, events(title, month, event_date)")
        .eq("status", "pending")
        .order("reminder_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // check every 30s
  });

  // Reminders that are due (reminder_date has passed but still pending)
  const dueReminders = reminders.filter(
    (r) => isPast(new Date(r.reminder_date)) && !dismissed.has(r.id)
  );

  // Upcoming reminders (not yet due)
  const upcomingReminders = reminders.filter(
    (r) => !isPast(new Date(r.reminder_date)) && !dismissed.has(r.id)
  );

  const activeCount = dueReminders.length + upcomingReminders.length;

  // Auto-toast for newly due reminders
  useEffect(() => {
    dueReminders.forEach((reminder) => {
      if (!toasted.has(reminder.id)) {
        const event = reminder.events as { title: string; month: string; event_date: string | null } | null;
        toast.warning(`🔔 Reminder Due: ${event?.title || "Event"}`, {
          description: reminder.message,
          duration: 10000,
        });
        setToasted((prev) => new Set(prev).add(reminder.id));
      }
    });
  }, [dueReminders, toasted]);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all">
          <Bell className="h-5 w-5" />
          {activeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-border bg-popover"
        side="right"
        align="start"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold text-sm text-foreground">Notifications</h4>
          <p className="text-xs text-muted-foreground">{activeCount} active reminder{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {dueReminders.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase font-semibold text-destructive tracking-wider">
                🔴 Due Now
              </p>
              {dueReminders.map((r) => {
                const event = r.events as { title: string; month: string; event_date: string | null } | null;
                return (
                  <div key={r.id} className="px-3 py-2 hover:bg-muted/50 border-b border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event?.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Was due {format(new Date(r.reminder_date), "MMM d, p")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismiss(r.id)}
                        className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {upcomingReminders.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase font-semibold text-info tracking-wider">
                🔵 Upcoming
              </p>
              {upcomingReminders.map((r) => {
                const event = r.events as { title: string; month: string; event_date: string | null } | null;
                return (
                  <div key={r.id} className="px-3 py-2 hover:bg-muted/50 border-b border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event?.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(r.reminder_date), "MMM d, p")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismiss(r.id)}
                        className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {activeCount === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">All caught up!</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

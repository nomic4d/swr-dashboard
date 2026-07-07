import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Send, Clock, CheckCircle, XCircle, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";

const statusIcons: Record<string, typeof Clock> = { pending: Clock, sent: CheckCircle, failed: XCircle };
const statusColors: Record<string, string> = { pending: "text-warning", sent: "text-success", failed: "text-destructive" };

const buildWaLink = (phone: string, message: string) => {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
};

const MessagesView = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [message, setMessage] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testEventId, setTestEventId] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_number");
      if (error) throw error;
      return (data ?? []).filter((e: any) => { const t = (e.title || "").trim().toLowerCase(); return !t.includes("available") && !t.includes("meeting"); });
    },
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reminders").select("*, events(title, month, event_date)").order("reminder_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Auto-fill date based on selected event (1 day before event)
  const handleEventSelect = (id: string) => {
    setEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev?.event_date) {
      const d = new Date(ev.event_date);
      d.setDate(d.getDate() - 1);
      d.setHours(9, 0, 0, 0);
      setReminderDate(d.toISOString().slice(0, 16));
      if (!message) setMessage(`Reminder: ${ev.title} is tomorrow! Please confirm your attendance.`);
    }
  };

  const handleTestEventSelect = (id: string) => {
    setTestEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev) {
      setTestMessage(`🔔 SWR PRM Test Reminder\n\nEvent: ${ev.title}\nDate: ${ev.event_date ? format(new Date(ev.event_date), "PPP") : "TBA"}\n\nPlease confirm your attendance.`);
    }
  };

  const addReminder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reminders").insert({
        event_id: eventId,
        message,
        reminder_date: new Date(reminderDate).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setEventId(""); setMessage(""); setReminderDate(""); setOpen(false);
      toast.success("Reminder scheduled");
    },
    onError: () => toast.error("Failed to schedule reminder"),
  });

  const markSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Marked as sent ✓");
    },
  });

  const sendTest = (phone: string) => {
    if (!phone || !testMessage) {
      toast.error("Phone and message required");
      return;
    }
    window.open(buildWaLink(phone, testMessage), "_blank");
    toast.success("WhatsApp opened — verify the message and tap Send");
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">WhatsApp Reminders</h2>
          <p className="text-muted-foreground text-sm mt-1">Schedule reminders by event date · send test messages via WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={testOpen} onOpenChange={setTestOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10">
                <MessageCircle className="h-4 w-4" /> Send Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send Test WhatsApp Reminder</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Select value={testEventId} onValueChange={handleTestEventSelect}>
                  <SelectTrigger><SelectValue placeholder="Pick event for the reminder" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>#{e.event_number} · {e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Message" rows={5} value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Send to staff member:</label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {staff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => sendTest(s.phone_number)}
                        disabled={!testMessage}
                        className="w-full flex items-center justify-between gap-2 p-2 rounded-md border border-border hover:bg-emerald-500/10 hover:border-emerald-500/50 transition disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5" />{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.phone_number}</span>
                      </button>
                    ))}
                    {staff.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No active staff. Add one in the Staff tab.</p>}
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs text-muted-foreground">Or send to a custom number:</label>
                  <div className="flex gap-2">
                    <Input placeholder="+92 300 1234567" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
                    <Button onClick={() => sendTest(testPhone)} disabled={!testPhone || !testMessage} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Send className="h-3.5 w-3.5" /> Send
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Schedule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule Reminder by Event Date</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Select value={eventId} onValueChange={handleEventSelect}>
                  <SelectTrigger><SelectValue placeholder="Select Event" /></SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        #{event.event_number} · {event.title} {event.event_date && `— ${format(new Date(event.event_date), "MMM d")}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Reminder message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Send date & time (auto-set 1 day before event)</label>
                  <Input type="datetime-local" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
                </div>
                <Button onClick={() => addReminder.mutate()} disabled={!eventId || !message || !reminderDate} className="w-full gap-2">
                  <Send className="h-4 w-4" /> Schedule Reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder, index) => {
          const StatusIcon = statusIcons[reminder.status] || Clock;
          const statusColor = statusColors[reminder.status] || "text-muted-foreground";
          const event = reminder.events as { title: string; month: string; event_date: string | null } | null;
          return (
            <div key={reminder.id} className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: `${index * 40}ms` }}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-muted ${statusColor}`}><StatusIcon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{event?.title || "Unknown Event"}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      reminder.status === "pending" ? "bg-warning/10 text-warning" :
                      reminder.status === "sent" ? "bg-success/10 text-success" :
                      "bg-destructive/10 text-destructive"
                    }`}>{reminder.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{reminder.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">Scheduled: {format(new Date(reminder.reminder_date), "PPP 'at' p")}</p>
                  <div className="flex gap-2 mt-3">
                    {staff.slice(0, 3).map((s) => (
                      <a
                        key={s.id}
                        href={buildWaLink(s.phone_number, reminder.message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition flex items-center gap-1"
                      >
                        <MessageCircle className="h-3 w-3" /> {s.name.split(" ")[0]}
                      </a>
                    ))}
                    {reminder.status !== "sent" && (
                      <button onClick={() => markSent.mutate(reminder.id)} className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success hover:bg-success/20 transition flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Mark sent
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {reminders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground glass-card rounded-xl">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No reminders scheduled yet.</p>
            <p className="text-sm mt-1">Schedule a reminder or send a test message to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;

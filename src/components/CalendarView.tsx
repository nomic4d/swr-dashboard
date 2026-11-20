import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPortalRole, canAccessManager } from "@/pages/portalUtils";
import { toast } from "sonner";
import CalendarEventModal from "./CalendarEventModal";
import { applyEventSchedule, CANONICAL_EVENTS } from "./calendarUtils";
import {
  MapPin,
  Calendar as CalendarIcon,
  Loader2,
  Citrus,
  Moon,
  Gamepad2,
  Bus,
  Mountain,
  Trophy,
  Music,
  Footprints,
  Film,
  Heart,
  Gift,
  Sparkles,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
} from "lucide-react";

const fallbackEvents = CANONICAL_EVENTS.map((event) => ({
  id: `fb-${event.key}`,
  title: event.title,
  event_date: event.event_date,
  month: event.month,
  event_number: event.event_number,
  location: event.location,
  description: null,
  created_at: "",
  updated_at: "",
}));

const MangoIcon = ({ className }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14.6 4.1c.7-.9 2-.9 2.6.1.5.8-.1 1.7-1 2.1 2.4.7 4.6 2.6 5.4 5.2 1.1 3.6-.4 7.2-3.5 8.8-3.3 1.7-7.4.7-9.6-2.3-2.3-3.1-2.4-7.4-.2-10.2 1.5-1.9 3.8-3 6.3-3.1-.4-.7-.2-1.5.4-1.9.1 0 .2.1.4.3-.3-.4-.2-.8-.8-.9z" />
    <path d="M13.4 3.4c1.5-1.3 3.2-.8 3.6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const restrictedKeywords = ["available", "meeting", "traveling", "vew"];

export const eventTheme: Record<number, { icon: typeof Citrus; gradient: string; ring: string }> = {
  1: { icon: Citrus, gradient: "from-orange-400 to-orange-600", ring: "ring-orange-400/40" },
  2: { icon: Moon, gradient: "from-emerald-400 to-emerald-600", ring: "ring-emerald-400/40" },
  3: { icon: Gamepad2, gradient: "from-sky-400 to-sky-600", ring: "ring-sky-400/40" },
  4: { icon: Bus, gradient: "from-cyan-400 to-cyan-600", ring: "ring-cyan-400/40" },
  5: { icon: Mountain, gradient: "from-indigo-400 to-indigo-600", ring: "ring-indigo-400/40" },
   6: { icon: MangoIcon, gradient: "from-yellow-300 to-orange-500", ring: "ring-orange-400/40" },
  7: { icon: Trophy, gradient: "from-rose-400 to-rose-600", ring: "ring-rose-400/40" },
  8: { icon: Music, gradient: "from-violet-400 to-violet-600", ring: "ring-violet-400/40" },
  9: { icon: Footprints, gradient: "from-teal-400 to-teal-600", ring: "ring-teal-400/40" },
  10: { icon: Film, gradient: "from-blue-400 to-blue-600", ring: "ring-blue-400/40" },
};

export const themeForEvent = (event: { title?: string | null; event_number?: number | null }) => {
  const title = (event.title || "").toLowerCase();
  if (title.includes("orange")) return eventTheme[1];
  if (title.includes("eid")) return eventTheme[2];
  if (title.includes("fiesta") || title.includes("games")) return eventTheme[3];
  if (title.includes("retreat") || title.includes("hill")) return eventTheme[5];
  if (title.includes("mango")) return eventTheme[6];
  if (title.includes("music")) return eventTheme[8];
  if (title.includes("gift") || title.includes("voucher")) return { icon: Gift, gradient: "from-amber-400 to-yellow-500", ring: "ring-amber-400/40" };
  if (title.includes("support")) return { icon: Heart, gradient: "from-rose-400 to-rose-600", ring: "ring-rose-400/40" };
  return eventTheme[event.event_number as number] || { icon: Sparkles, gradient: "from-gray-400 to-gray-600", ring: "ring-gray-400/40" };
};

const CalendarView = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isManagerFormOpen, setIsManagerFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    location_link: "",
    organizer_name: "",
    organizer_phone: "",
    departure_time: "",
    arrival_time: "",
    is_night_stay: false,
    event_date: format(new Date(), "yyyy-MM-dd"),
    event_time: "",
    timings: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const role = useMemo(() => getPortalRole(user?.email, (user as any)?.user_metadata?.role), [user]);
  const canManage = canAccessManager(role);

  const { data: events = fallbackEvents, isFetching } = useQuery({
    queryKey: ["events"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from("events").select("*").order("event_number").abortSignal(signal);
      if (error || !data?.length) return fallbackEvents;
      return applyEventSchedule((data ?? []).filter((e: any) => { const t = (e.title || "").trim().toLowerCase(); return !restrictedKeywords.some((k) => t.includes(k)); }));
    },
    initialData: fallbackEvents,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    refetchOnWindowFocus: true,
  });

  const queryClient = useQueryClient();

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast.success("Event deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from("events").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast.success("Event updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const visibleEvents = useMemo(() =>
    applyEventSchedule(events).sort((a, b) => {
      const aDate = a.event_date ? new Date(a.event_date).getTime() : 0;
      const bDate = b.event_date ? new Date(b.event_date).getTime() : 0;
      return aDate - bDate;
    }),
  [events]);

  const getFormValues = (event?: any) => {
    const description = typeof event?.description === "string" ? event.description : "";
    const parts = description.split(/\n\s*\n/).filter(Boolean);
    const readLine = (label: string) => {
      const match = parts.find((part: string) => part.toLowerCase().startsWith(label.toLowerCase()));
      return match ? match.slice(label.length).trim() : "";
    };
    const timings = readLine("Timings:") || event?.start_time || "";
    const nightStay = readLine("Night Stay:");
    const body = parts.filter((part: string) => !/^(Timings|Category|Location Link|Organizer Phone|Organizer|Departure Time|Arrival Time|Night Stay):/i.test(part)).join("\n\n");

    return {
      title: event?.title || "",
      category: event?.category || readLine("Category:"),
      description: body,
      location: event?.location || "",
      location_link: event?.location_link || readLine("Location Link:"),
      organizer_name: event?.organizer_name || readLine("Organizer:"),
      organizer_phone: event?.organizer_phone || readLine("Organizer Phone:"),
      departure_time: event?.departure_time || readLine("Departure Time:"),
      arrival_time: event?.arrival_time || readLine("Arrival Time:") || event?.end_time || "",
      is_night_stay: event?.is_night_stay ?? /^yes$/i.test(nightStay),
      event_date: (event?.event_date || format(new Date(), "yyyy-MM-dd")).slice(0, 10),
      event_time: event?.event_time || "",
      timings,
    };
  };

  const renderCard = (event: any, index: number) => {
    const past = event.event_date ? isPast(new Date(event.event_date)) : false;
    const theme = themeForEvent(event);
    const Icon = theme.icon;

    return (
      <div key={event.id} className="relative rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow min-h-[220px]">
        <div className={`bg-gradient-to-br ${theme.gradient} p-3 relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 opacity-15">
            <Icon className="h-24 w-24 text-white" strokeWidth={1.2} />
          </div>
          <div className="relative flex items-center justify-between">
            <div className={`p-1.5 rounded-lg bg-white/25 backdrop-blur-sm ring-2 ${theme.ring}`}>
              <Icon className="h-4 w-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-[10px] bg-white/25 text-white px-2 py-0.5 rounded-full font-bold backdrop-blur-sm">#{event.event_number}</span>
          </div>
          <h3 className="relative text-xl font-bold text-white mt-2 leading-tight drop-shadow">{event.title}</h3>
          <p className="relative text-white/80 text-[10px] font-medium mt-0.5">{event.month}</p>
        </div>
        <div className="p-2.5 space-y-1">
          {event.event_date && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              <span>{format(new Date(event.event_date), "MMM d, yyyy")}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{event.location}</span>
            </div>
          )}
          {past && <span className="inline-block text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Completed</span>}
        </div>
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {canManage && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-foreground/70 hover:text-foreground shadow-sm transition-colors"
                title="Edit event"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Delete this event?")) deleteEvent.mutate(event.id); }}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-foreground/70 hover:text-destructive shadow-sm transition-colors"
                title="Delete event"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenEvent(event); }}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-foreground/70 hover:text-foreground shadow-sm transition-colors"
            title="Event info"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const handleOpenEvent = (event: any) => {
    setSelectedEvent(event);
    setForm(getFormValues(event));
    setIsEditing(false);
    setIsDetailsOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setForm(getFormValues(event));
    setIsEditing(true);
    setIsDetailsOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!form.title || !form.event_date) return;
    const titleLower = form.title.trim().toLowerCase();
    if (restrictedKeywords.some((k) => titleLower.includes(k))) {
      toast.error(`"${form.title}" is a restricted title and cannot be used`);
      return;
    }
    const detailLines = [
      form.category ? `Category: ${form.category}` : "",
      form.timings ? `Timings: ${form.timings}` : "",
      form.location_link ? `Location Link: ${form.location_link}` : "",
      form.organizer_name ? `Organizer: ${form.organizer_name}` : "",
      form.organizer_phone ? `Organizer Phone: ${form.organizer_phone}` : "",
      form.departure_time ? `Departure Time: ${form.departure_time}` : "",
      form.arrival_time ? `Arrival Time: ${form.arrival_time}` : "",
      `Night Stay: ${form.is_night_stay ? "Yes" : "No"}`,
    ].filter(Boolean);
    const combinedDescription = [form.description, ...detailLines].filter(Boolean).join("\n\n");
    const eventDate = new Date(`${form.event_date}T12:00:00`);
    const payload: Record<string, string | number | null> = {
      title: form.title.trim(),
      description: combinedDescription || null,
      location: form.location || null,
      event_date: form.event_date,
      month: format(eventDate, "MMMM"),
      start_time: form.departure_time || form.timings || null,
      end_time: form.arrival_time || null,
    };
    const editing = Boolean(selectedEvent?.id && isEditing);
    if (!editing) payload.event_number = events.length + 1;
    const { data, error } = editing
      ? await supabase.from("events").update(payload).eq("id", selectedEvent.id).select("id")
      : await supabase.from("events").insert(payload).select("id");
    if (error || !data?.length) {
      toast.error(error?.message || "Could not update event");
      return;
    }
    toast.success(editing ? "Event updated" : "Event created");
    queryClient.invalidateQueries({ queryKey: ["events"] });
    setIsManagerFormOpen(false);
    setIsDetailsOpen(false);
    setIsEditing(false);
    setForm({
      title: "",
      category: "",
      description: "",
      location: "",
      location_link: "",
      organizer_name: "",
      organizer_phone: "",
      departure_time: "",
      arrival_time: "",
      is_night_stay: false,
      event_date: format(new Date(), "yyyy-MM-dd"),
      event_time: "",
      timings: "",
    });
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Events</h2>
          <p className="text-[11px] text-muted-foreground">Upcoming and past events</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Dialog open={isManagerFormOpen} onOpenChange={setIsManagerFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> New</Button>
              </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Create event</DialogTitle></DialogHeader>
                  <div className="space-y-2">
                    <Input placeholder="Event name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    {restrictedKeywords.some((k) => form.title.trim().toLowerCase().includes(k)) && (
                      <p className="text-[11px] text-destructive">This title is restricted</p>
                    )}
                    <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                    <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                    <Button size="sm" className="w-full" onClick={handleCreateEvent} disabled={restrictedKeywords.some((k) => form.title.trim().toLowerCase().includes(k))}>Save event</Button>
                  </div>
                </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isFetching && (
        <div className="flex items-center justify-center rounded-lg border bg-card/60 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Refreshing…
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleEvents.map((event, index) => renderCard(event, index))}
      </div>

      <CalendarEventModal
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        canManage={canManage}
        isEditing={isEditing}
        form={form}
        onFormChange={setForm}
        onSave={handleCreateEvent}
        onStartEdit={() => {
          setIsEditing(true);
          setForm(getFormValues(selectedEvent));
        }}
        onCancelEdit={() => {
          setIsEditing(false);
          setForm(getFormValues(selectedEvent));
        }}
      />
    </div>
  );
};

export default CalendarView;

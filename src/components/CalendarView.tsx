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
import {
  MapPin,
  Calendar as CalendarIcon,
  Loader2,
  Citrus,
  Moon,
  Gamepad2,
  Bus,
  Mountain,
  Grape,
  Trophy,
  Music,
  Footprints,
  Film,
  Sparkles,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
} from "lucide-react";

const fallbackEvents = [
  { id: "fb-1", title: "Orange Fest", event_date: "2026-02-02", month: "February", event_number: 1, location: "Islamabad", description: null, created_at: "", updated_at: "" },
  { id: "fb-2", title: "Eid Milan Party (High Tea)", event_date: "2026-03-15", month: "March", event_number: 2, location: "Islamabad", description: null, created_at: "", updated_at: "" },
  { id: "fb-3", title: "Fun Fiesta Office Games Day", event_date: "2026-04-28", month: "April", event_number: 3, location: "Islamabad", description: null, created_at: "", updated_at: "" },
  { id: "fb-4", title: "Day Trip to Tarbela Lake", event_date: "2026-05-28", month: "May", event_number: 4, location: "Tarbela", description: null, created_at: "", updated_at: "" },
  { id: "fb-5", title: "One Night Retreat at Hill Station & Dinner", event_date: "2026-06-15", month: "June", event_number: 5, location: "Hill Station", description: null, created_at: "", updated_at: "" },
  { id: "fb-6", title: "Mango Fest", event_date: "2026-07-15", month: "July-August", event_number: 6, location: "Islamabad", description: null, created_at: "", updated_at: "" },
  { id: "fb-7", title: "Sports Week", event_date: "2026-09-12", month: "September", event_number: 7, location: "Islamabad", description: null, created_at: "", updated_at: "" },
  { id: "fb-8", title: "Music Night", event_date: "2026-10-17", month: "October", event_number: 8, location: "Islamabad", description: null, created_at: "", updated_at: "" },
  { id: "fb-9", title: "Hike and Drink", event_date: "2026-11-14", month: "November", event_number: 9, location: "Margalla Hills", description: null, created_at: "", updated_at: "" },
  { id: "fb-10", title: "Soup Day / Movie Night", event_date: "2026-12-12", month: "December", event_number: 10, location: "Islamabad", description: null, created_at: "", updated_at: "" },
];

export const eventTheme: Record<number, { icon: typeof Citrus; gradient: string; ring: string }> = {
  1: { icon: Citrus, gradient: "from-orange-400 to-orange-600", ring: "ring-orange-400/40" },
  2: { icon: Moon, gradient: "from-emerald-400 to-emerald-600", ring: "ring-emerald-400/40" },
  3: { icon: Gamepad2, gradient: "from-sky-400 to-sky-600", ring: "ring-sky-400/40" },
  4: { icon: Bus, gradient: "from-cyan-400 to-cyan-600", ring: "ring-cyan-400/40" },
  5: { icon: Mountain, gradient: "from-indigo-400 to-indigo-600", ring: "ring-indigo-400/40" },
   6: { icon: Grape, gradient: "from-amber-400 to-amber-600", ring: "ring-amber-400/40" },
  7: { icon: Trophy, gradient: "from-rose-400 to-rose-600", ring: "ring-rose-400/40" },
  8: { icon: Music, gradient: "from-violet-400 to-violet-600", ring: "ring-violet-400/40" },
  9: { icon: Footprints, gradient: "from-teal-400 to-teal-600", ring: "ring-teal-400/40" },
  10: { icon: Film, gradient: "from-blue-400 to-blue-600", ring: "ring-blue-400/40" },
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
      return (data ?? []).filter((e: any) => { const t = (e.title || "").trim().toLowerCase(); return t !== "available" && t !== "meeting"; });
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
    [...events].sort((a, b) => {
      const aDate = a.event_date ? new Date(a.event_date).getTime() : 0;
      const bDate = b.event_date ? new Date(b.event_date).getTime() : 0;
      return aDate - bDate;
    }),
  [events]);

  const getFormValues = (event?: any) => {
    const description = typeof event?.description === "string" ? event.description : "";
    const parts = description.split(/\n\s*\n/).filter(Boolean);
    const timings = parts.find((part: string) => /^Timings:/i.test(part))?.replace(/^Timings:\s*/i, "") || "";
    const body = parts.filter((part: string) => !/^Timings:/i.test(part)).join("\n\n");

    const detailLines = [
      event?.location_link ? `Location Link: ${event.location_link}` : "",
      event?.organizer_name ? `Organizer: ${event.organizer_name}` : "",
      event?.organizer_phone ? `Organizer Phone: ${event.organizer_phone}` : "",
      event?.departure_time ? `Departure Time: ${event.departure_time}` : "",
      event?.arrival_time ? `Arrival Time: ${event.arrival_time}` : "",
      event?.is_night_stay !== undefined && event?.is_night_stay !== null ? `Night Stay: ${event.is_night_stay ? "Yes" : "No"}` : "",
    ].filter(Boolean);

    return {
      title: event?.title || "",
      category: event?.category || "",
      description: body,
      location: event?.location || "",
      location_link: event?.location_link || "",
      organizer_name: event?.organizer_name || "",
      organizer_phone: event?.organizer_phone || "",
      departure_time: event?.departure_time || "",
      arrival_time: event?.arrival_time || "",
      is_night_stay: Boolean(event?.is_night_stay),
      event_date: event?.event_date || format(new Date(), "yyyy-MM-dd"),
      event_time: event?.event_time || "",
      timings,
      detailLines,
    };
  };

  const renderCard = (event: any, index: number) => {
    const past = event.event_date ? isPast(new Date(event.event_date)) : false;
    const theme = eventTheme[event.event_number as number] || { icon: Sparkles, gradient: "from-gray-400 to-gray-600", ring: "ring-gray-400/40" };
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
            onClick={() => handleOpenEvent(event)}
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
    setIsEditing(canManage);
    setIsDetailsOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setForm(getFormValues(event));
    setIsEditing(true);
    setIsDetailsOpen(true);
  };

  const restrictedTitles = ["available", "meeting"];
  const handleCreateEvent = async () => {
    if (!form.title || !form.event_date) return;
    const titleLower = form.title.trim().toLowerCase();
    if (restrictedTitles.includes(titleLower)) {
      toast.error(`"${form.title}" is a restricted title and cannot be used`);
      return;
    }
    const detailLines = [
      form.location_link ? `Location Link: ${form.location_link}` : "",
      form.organizer_name ? `Organizer: ${form.organizer_name}` : "",
      form.organizer_phone ? `Organizer Phone: ${form.organizer_phone}` : "",
      form.departure_time ? `Departure Time: ${form.departure_time}` : "",
      form.arrival_time ? `Arrival Time: ${form.arrival_time}` : "",
      `Night Stay: ${form.is_night_stay ? "Yes" : "No"}`,
    ].filter(Boolean);
    const combinedDescription = [form.description, form.timings ? `Timings: ${form.timings}` : "", ...detailLines].filter(Boolean).join("\n\n");
    const payload = {
      title: form.title,
      category: form.category || null,
      description: combinedDescription || null,
      location: form.location || null,
      location_link: form.location_link || null,
      organizer_name: form.organizer_name || null,
      organizer_phone: form.organizer_phone || null,
      departure_time: form.departure_time || null,
      arrival_time: form.arrival_time || null,
      is_night_stay: form.is_night_stay,
      event_date: form.event_date,
      month: format(new Date(form.event_date), "MMMM"),
      event_number: events.length + 1,
    };
    const { error } = selectedEvent?.id && isEditing
      ? await supabase.from("events").update(payload).eq("id", selectedEvent.id)
      : await supabase.from("events").insert(payload);
    if (!error) {
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
      window.location.reload();
    }
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
                    {restrictedTitles.includes(form.title.trim().toLowerCase()) && (
                      <p className="text-[11px] text-destructive">"Available" and "Meeting" are restricted titles</p>
                    )}
                    <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                    <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                    <Button size="sm" className="w-full" onClick={handleCreateEvent} disabled={restrictedTitles.includes(form.title.trim().toLowerCase())}>Save event</Button>
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

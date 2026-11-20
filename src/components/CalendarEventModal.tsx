import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarDays, MapPin, PencilLine, Phone, UserRound, Clock3, BedDouble, Navigation } from "lucide-react";
import { restrictedKeywords, themeForEvent } from "./CalendarView";
import FizzySparks from "./FizzySparks";

const DETAIL_LABELS = ["Organizer Phone", "Location Link", "Departure Time", "Arrival Time", "Night Stay", "Category", "Timings", "Organizer"];

const readEventCopy = (event: any) => {
  const raw = typeof event?.description === "string" ? event.description : "";
  const pattern = new RegExp(`(${DETAIL_LABELS.join("|")}):\\s*`, "gi");
  const hits: { label: string; start: number; valueStart: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    hits.push({ label: match[1].toLowerCase(), start: match.index, valueStart: pattern.lastIndex });
  }
  const fields: Record<string, string> = {};
  hits.forEach((hit, index) => {
    const end = hits[index + 1]?.start ?? raw.length;
    fields[hit.label] = raw.slice(hit.valueStart, end).replace(/\s+/g, " ").trim();
  });
  return {
    overview: (hits.length ? raw.slice(0, hits[0].start) : raw).trim(),
    category: event?.category || fields.category || "Event",
    timings: fields.timings || event?.start_time || "",
    locationLink: event?.location_link || fields["location link"] || "",
    organizer: event?.organizer_name || fields.organizer || "",
    phone: event?.organizer_phone || fields["organizer phone"] || "",
    departure: event?.departure_time || fields["departure time"] || "",
    arrival: event?.arrival_time || fields["arrival time"] || event?.end_time || "",
    nightStay: event?.is_night_stay === true || /^yes$/i.test(fields["night stay"] || ""),
    nightStayKnown: event?.is_night_stay != null || Boolean(fields["night stay"]),
  };
};

interface CalendarEventModalProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  isEditing: boolean;
  form: any;
  onFormChange: (value: any) => void;
  onSave: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

const CalendarEventModal = ({ event, open, onOpenChange, canManage, isEditing, form, onFormChange, onSave, onStartEdit, onCancelEdit }: CalendarEventModalProps) => {
  if (!event) return null;
  const details = readEventCopy(event);
  const theme = themeForEvent(event);
  const Icon = theme.icon;
  const dateStr = String(event.event_date || "").slice(0, 10);
  const today = format(new Date(), "yyyy-MM-dd");
  const when = dateStr ? format(new Date(`${dateStr}T12:00:00`), "MMMM d, yyyy") : "Date to be announced";
  const status = !dateStr
    ? "Date not set"
    : dateStr < today
      ? "Already happened"
      : dateStr === today
        ? "Happening today"
        : "Upcoming";
  const title = `${event.title || ""}`.toLowerCase();
  const showSparks = title.includes("fusion") || title.includes("cuisine") || title.includes("cultural");
  const mapHref = details.locationLink
    ? (/^https?:\/\//i.test(details.locationLink) ? details.locationLink : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.locationLink)}`)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 [&>button]:z-30">
        {showSparks && <FizzySparks />}
        <div className={`relative bg-gradient-to-br ${theme.gradient} px-6 py-5 text-white`}>
          <div className="absolute -right-6 -top-8 opacity-20">
            <Icon className="h-32 w-32" strokeWidth={1.2} />
          </div>
          <DialogHeader className="relative space-y-2 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">{isEditing ? "Edit event" : (event.month || "Event")}</p>
            <DialogTitle className="text-2xl text-white">{isEditing ? (form.title || event.title) : event.title}</DialogTitle>
            {!isEditing && (
              <p className="text-sm font-medium text-white/90">{status}{dateStr ? ` · ${when}` : ""}</p>
            )}
          </DialogHeader>
        </div>
        <div className="space-y-4 p-6">
        {canManage && isEditing ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Event title</label>
                <Input value={form.title || ""} onChange={(e) => onFormChange({ ...form, title: e.target.value })} placeholder="Event title" />
                {restrictedKeywords.some((k) => (form.title || "").trim().toLowerCase().includes(k)) && (
                  <p className="mt-1 text-[11px] text-destructive">This title is restricted</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
                <Input value={form.category || ""} onChange={(e) => onFormChange({ ...form, category: e.target.value })} placeholder="Category" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/40 p-3">
                <CalendarDays className="mb-2 h-4 w-4 text-primary" />
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Date</label>
                <Input type="date" value={form.event_date || ""} onChange={(e) => onFormChange({ ...form, event_date: e.target.value })} />
                <label className="mb-1 mt-2 block text-[11px] uppercase tracking-wide text-muted-foreground">Timings</label>
                <Input value={form.timings || ""} onChange={(e) => onFormChange({ ...form, timings: e.target.value })} placeholder="06:00 Onwards" />
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <MapPin className="mb-2 h-4 w-4 text-primary" />
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Location</label>
                <Input value={form.location || ""} onChange={(e) => onFormChange({ ...form, location: e.target.value })} placeholder="Location" />
                <label className="mb-1 mt-2 block text-[11px] uppercase tracking-wide text-muted-foreground">Map link</label>
                <Input value={form.location_link || ""} onChange={(e) => onFormChange({ ...form, location_link: e.target.value })} placeholder="islamabad or maps url" />
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <Clock3 className="mb-2 h-4 w-4 text-primary" />
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Departure</label>
                <Input value={form.departure_time || ""} onChange={(e) => onFormChange({ ...form, departure_time: e.target.value })} placeholder="5:30 PM" />
                <label className="mb-1 mt-2 block text-[11px] uppercase tracking-wide text-muted-foreground">Arrival</label>
                <Input value={form.arrival_time || ""} onChange={(e) => onFormChange({ ...form, arrival_time: e.target.value })} placeholder="10:00 pm" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-xl border p-4">
                <label className="text-sm font-semibold">About this event</label>
                <Textarea className="mt-2" value={form.description || ""} onChange={(e) => onFormChange({ ...form, description: e.target.value })} rows={5} placeholder="Music night performance" />
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Organizer</p>
                <div className="mt-3 space-y-2">
                  <Input value={form.organizer_name || ""} onChange={(e) => onFormChange({ ...form, organizer_name: e.target.value })} placeholder="Name" />
                  <Input value={form.organizer_phone || ""} onChange={(e) => onFormChange({ ...form, organizer_phone: e.target.value })} placeholder="Phone" />
                  <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                    <BedDouble className="h-4 w-4 text-primary" />
                    <input id="night-stay" type="checkbox" checked={Boolean(form.is_night_stay)} onChange={(e) => onFormChange({ ...form, is_night_stay: e.target.checked })} />
                    Night stay
                  </label>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={onCancelEdit}>Cancel</Button>
              <Button className="gap-2" onClick={onSave} disabled={restrictedKeywords.some((k) => (form.title || "").trim().toLowerCase().includes(k))}><PencilLine className="h-4 w-4" /> Update Event</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{status}</Badge>
              <Badge variant="secondary">{details.category}</Badge>
              {details.nightStayKnown && <Badge variant="outline">{details.nightStay ? "Night stay" : "No night stay"}</Badge>}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/40 p-3">
                <CalendarDays className="mb-2 h-4 w-4 text-primary" />
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Date</p>
                <p className="text-sm font-semibold">{when}</p>
                {details.timings && <p className="text-xs text-muted-foreground">{details.timings}</p>}
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <MapPin className="mb-2 h-4 w-4 text-primary" />
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Location</p>
                <p className="text-sm font-semibold">{event.location || "To be announced"}</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <Clock3 className="mb-2 h-4 w-4 text-primary" />
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Travel</p>
                <p className="text-sm font-semibold">{details.departure ? `Leave ${details.departure}` : "Departure not set"}</p>
                <p className="text-xs text-muted-foreground">{details.arrival ? `Arrive ${details.arrival}` : "Arrival not set"}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold">About this event</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{details.overview || "No description yet."}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Organizer</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /> {details.organizer || "Not assigned"}</p>
                  {details.phone && <a href={`tel:${details.phone}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="h-4 w-4" /> {details.phone}</a>}
                  {details.nightStayKnown && <p className="flex items-center gap-2 text-muted-foreground"><BedDouble className="h-4 w-4" /> {details.nightStay ? "Overnight stay" : "Day event"}</p>}
                </div>
                {mapHref && (
                  <a href={mapHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    <Navigation className="h-4 w-4" /> Open map
                  </a>
                )}
              </div>
            </div>
            {canManage && <div className="flex justify-end"><Button className="gap-2" onClick={onStartEdit}>Manage Event</Button></div>}
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventModal;

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, Info, Share2, Download, Mail, PencilLine, Phone, UserRound, Clock3, BedDouble } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>
        {canManage && isEditing ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Event title</label>
                  <Input value={form.title || ""} onChange={(e) => onFormChange({ ...form, title: e.target.value })} placeholder="Event title" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Location</label>
                  <Input value={form.location || ""} onChange={(e) => onFormChange({ ...form, location: e.target.value })} placeholder="Location" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Google Map Link</label>
                  <Input value={form.location_link || ""} onChange={(e) => onFormChange({ ...form, location_link: e.target.value })} placeholder="https://maps.google.com/..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Date</label>
                  <Input type="date" value={form.event_date || ""} onChange={(e) => onFormChange({ ...form, event_date: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Time / timings</label>
                  <Input value={form.timings || ""} onChange={(e) => onFormChange({ ...form, timings: e.target.value })} placeholder="e.g. 6:00 PM onwards" />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <Input value={form.category || ""} onChange={(e) => onFormChange({ ...form, category: e.target.value })} placeholder="Category" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Organizer Name</label>
                  <Input value={form.organizer_name || ""} onChange={(e) => onFormChange({ ...form, organizer_name: e.target.value })} placeholder="Organizer name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Organizer Phone</label>
                  <Input value={form.organizer_phone || ""} onChange={(e) => onFormChange({ ...form, organizer_phone: e.target.value })} placeholder="Organizer phone" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Departure Time</label>
                  <Input value={form.departure_time || ""} onChange={(e) => onFormChange({ ...form, departure_time: e.target.value })} placeholder="e.g. 4:30 PM" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Arrival Time</label>
                  <Input value={form.arrival_time || ""} onChange={(e) => onFormChange({ ...form, arrival_time: e.target.value })} placeholder="e.g. 8:30 PM" />
                </div>
                <div className="flex items-center gap-2 rounded-md border p-3">
                  <input id="night-stay" type="checkbox" checked={Boolean(form.is_night_stay)} onChange={(e) => onFormChange({ ...form, is_night_stay: e.target.checked })} />
                  <label htmlFor="night-stay" className="text-sm font-medium">Is night stay required?</label>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Details</label>
                  <Textarea value={form.description || ""} onChange={(e) => onFormChange({ ...form, description: e.target.value })} rows={8} placeholder="Add event details" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={onCancelEdit}>Cancel</Button>
              <Button className="gap-2" onClick={onSave}><PencilLine className="h-4 w-4" /> Update Event</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{event.category || "Event"}</Badge>
              <Badge variant="outline">{event.location || "TBA"}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {event.event_date ? format(new Date(event.event_date), "PPP") : "TBD"}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location || "Venue to be confirmed"}</div>
                {event.location_link ? <a href={event.location_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline"><MapPin className="h-4 w-4" /> Open in Google Maps</a> : null}
                {event.organizer_name ? <div className="flex items-center gap-2"><UserRound className="h-4 w-4" /> Organizer: {event.organizer_name}</div> : null}
                {event.organizer_phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone: {event.organizer_phone}</div> : null}
                {event.departure_time ? <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Departure: {event.departure_time}</div> : null}
                {event.arrival_time ? <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Arrival: {event.arrival_time}</div> : null}
                {event.is_night_stay !== undefined && event.is_night_stay !== null ? <div className="flex items-center gap-2"><BedDouble className="h-4 w-4" /> Night stay: {event.is_night_stay ? "Yes" : "No"}</div> : null}
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Expected participants: {event.expected_participants || "TBC"}</div>
              </div>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Event overview</p>
                <p className="mt-2">{event.description || "No description provided yet."}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2"><Info className="h-4 w-4" /> View Event Details</Button>
              <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Download Event Details</Button>
              <Button variant="outline" className="gap-2"><Share2 className="h-4 w-4" /> Share Event</Button>
              <Button variant="outline" className="gap-2"><Mail className="h-4 w-4" /> Contact Organizer</Button>
              {canManage && <Button className="gap-2" onClick={onStartEdit}>Manage Event</Button>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventModal;

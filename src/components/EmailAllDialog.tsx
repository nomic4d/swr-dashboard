import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, UserPlus, X } from "lucide-react";
import { format } from "date-fns";

type Recipient = { id: string; name: string; email?: string | null };
type EventOption = { id: string; title?: string | null; event_date?: string | null; event_number?: number | null };

const validEmail = (value?: string | null) => Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));

type Guest = { id: string; name: string; email: string };

const EmailPanel = ({ recipients, events = [] }: { recipients: Recipient[]; events?: EventOption[] }) => {
  const withEmail = useMemo(() => recipients.filter((person) => validEmail(person.email)), [recipients]);
  const [eventId, setEventId] = useState("");
  const [subject, setSubject] = useState("SWR PRM - Event Reminder");
  const [body, setBody] = useState("Hello,\n\nThis is a reminder about an upcoming SWR event.\n\nPlease confirm your attendance.\n\nBest regards,\nSWR PRM Team");
  const [picked, setPicked] = useState<string[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestPicked, setGuestPicked] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || withEmail.length === 0) return;
    setPicked(withEmail.map((person) => person.id));
    seeded.current = true;
  }, [withEmail]);

  const applyEvent = (id: string) => {
    setEventId(id);
    const event = events.find((item) => item.id === id);
    if (!event) return;
    const when = event.event_date ? format(new Date(event.event_date), "MMMM d, yyyy") : "the announced date";
    setSubject(`Reminder: ${event.title || "SWR event"}`);
    setBody(`Hello,\n\nThis is a reminder for ${event.title || "the upcoming event"} on ${when}.\n\nPlease confirm your attendance.\n\nBest regards,\nSWR PRM Team`);
  };

  const addGuest = () => {
    const email = guestEmail.trim();
    if (!validEmail(email)) {
      toast.error("Sahi email likho");
      return;
    }
    const already = guests.some((guest) => guest.email.toLowerCase() === email.toLowerCase())
      || withEmail.some((person) => person.email?.toLowerCase() === email.toLowerCase());
    if (already) {
      toast.error("Yeh email pehle se list mein hai");
      return;
    }
    const guest = { id: crypto.randomUUID(), name: guestName.trim() || email, email };
    setGuests((current) => [...current, guest]);
    setGuestPicked((current) => [...current, guest.id]);
    setGuestName("");
    setGuestEmail("");
  };

  const send = async () => {
    const chosen = withEmail.filter((person) => picked.includes(person.id));
    const invited = guests.filter((guest) => guestPicked.includes(guest.id));
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject aur message likho");
      return;
    }
    const emails = [...new Set([...chosen.map((person) => person.email!.trim()), ...invited.map((guest) => guest.email.trim())])];
    if (!emails.length) {
      toast.error("Staff select karo ya bahar ka email add karo");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body, to: emails }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Email nahi gayi");
      toast.success(`${subject.trim()} — ${emails.length} ko bhej diya`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email nahi gayi");
    } finally {
      setSending(false);
    }
  };

  const allPicked = withEmail.length > 0 && picked.length === withEmail.length;
  const recipientCount = picked.length + guestPicked.length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">Yahin se seedha chali jati hai</p>
        </div>
        {events.length > 0 && (
          <select
            value={eventId}
            onChange={(e) => applyEvent(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Pick an event to fill the message</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.event_number ? `#${event.event_number} · ` : ""}{event.title}
              </option>
            ))}
          </select>
        )}
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
        <Button type="button" onClick={send} disabled={sending || !recipientCount || !subject.trim() || !body.trim()} className="gap-2">
          <Send className="h-4 w-4" /> {sending ? "Sending..." : `Send to ${recipientCount || "all"}`}
        </Button>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 space-y-2 border-b pb-3">
          <p className="text-sm font-semibold">Invite someone outside</p>
          <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Name (optional)" />
          <div className="flex gap-2">
            <Input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }}
              placeholder="guest@email.com"
            />
            <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={addGuest}>
              <UserPlus className="h-4 w-4" /> Add
            </Button>
          </div>
          {guests.length > 0 && (
            <div className="space-y-1.5">
              {guests.map((guest) => (
                <label key={guest.id} className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={guestPicked.includes(guest.id)}
                      onChange={(e) => setGuestPicked((current) => e.target.checked ? [...current, guest.id] : current.filter((id) => id !== guest.id))}
                    />
                    <span className="truncate">{guest.name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="max-w-[140px] truncate text-xs text-muted-foreground">{guest.email}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setGuests((current) => current.filter((item) => item.id !== guest.id));
                        setGuestPicked((current) => current.filter((id) => id !== guest.id));
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{picked.length} of {withEmail.length} staff</span>
          <button
            type="button"
            className="font-medium text-primary"
            onClick={() => setPicked(allPicked ? [] : withEmail.map((person) => person.id))}
          >
            {allPicked ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
          {withEmail.map((person) => (
            <label key={person.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={picked.includes(person.id)}
                  onChange={(e) => setPicked((current) => e.target.checked ? [...current, person.id] : current.filter((id) => id !== person.id))}
                />
                {person.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">{person.email}</span>
            </label>
          ))}
          {withEmail.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No staff email addresses yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default EmailPanel;

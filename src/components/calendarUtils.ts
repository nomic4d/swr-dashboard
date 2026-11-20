import { isSameDay, isSameMonth, isSameWeek, parseISO } from "date-fns";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  event_date?: string | null;
  month?: string | null;
  event_number?: number | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}

type ScheduledEvent = {
  key: string;
  title: string;
  month: string;
  event_date: string;
  event_number: number;
  location: string;
};

export const CANONICAL_EVENTS: ScheduledEvent[] = [
  { key: "orange", title: "Orange Fest", month: "February", event_date: "2026-02-02", event_number: 1, location: "Islamabad" },
  { key: "eid", title: "Eid Milan Party (High Tea)", month: "March", event_date: "2026-03-15", event_number: 2, location: "Islamabad" },
  { key: "mango", title: "Mango Fest", month: "June-July", event_date: "2026-06-05", event_number: 3, location: "Islamabad" },
  { key: "retreat-june", title: "One Night Retreat at Hill", month: "June", event_date: "2026-06-15", event_number: 4, location: "Hill Station" },
  { key: "retreat-july", title: "One Night Retreat at Hill", month: "July", event_date: "2026-07-18", event_number: 5, location: "Hill Station" },
  { key: "fiesta", title: "Fun Fiesta Office Games Day", month: "November", event_date: "2026-11-08", event_number: 6, location: "Islamabad" },
  { key: "music", title: "Music Night", month: "November", event_date: "2026-11-22", event_number: 7, location: "Islamabad" },
  { key: "supports", title: "Sports Day", month: "December", event_date: "2026-12-12", event_number: 8, location: "Islamabad" },
  { key: "gift", title: "Gift Vouchers for Staff", month: "December", event_date: "2026-12-20", event_number: 9, location: "Islamabad" },
];

const scheduleKey = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("orange")) return "orange";
  if (t.includes("eid")) return "eid";
  if (t.includes("mango")) return "mango";
  if (t.includes("tarbela") || t.includes("day trip")) return "retreat-july";
  if (t.includes("retreat") || t.includes("hill")) return "retreat-june";
  if (t.includes("fiesta") || t.includes("games")) return "fiesta";
  if (t.includes("music")) return "music";
  if (t.includes("gift") || t.includes("voucher")) return "gift";
  if (t.includes("sport") || t.includes("support") || t.includes("soup") || t.includes("movie")) return "supports";
  return null;
};

export const applyEventSchedule = <T extends CalendarEventItem>(events: T[]): T[] => {
  const retreats = events.filter((event) => scheduleKey(event.title || "") === "retreat-june").length;
  const present = new Set(events.map((event) => scheduleKey(event.title || "")).filter(Boolean));
  const missing = CANONICAL_EVENTS.filter((slot) => {
    if (slot.key === "retreat-july") return retreats < 2;
    if (slot.key === "retreat-june") return retreats < 1;
    return !present.has(slot.key);
  });
  return [
    ...events,
    ...missing.map((slot) => ({
      id: `schedule-${slot.key}`,
      title: slot.title,
      month: slot.month,
      event_date: slot.event_date,
      event_number: slot.event_number,
      location: slot.location,
      description: null,
    }) as T),
  ];
};

export const getEventsForView = (
  events: CalendarEventItem[],
  view: CalendarViewMode,
  selectedDate: string,
) => {
  const selected = parseISO(selectedDate);

  const sorted = [...events].sort((a, b) => {
    const aDate = a.event_date ? new Date(a.event_date).getTime() : 0;
    const bDate = b.event_date ? new Date(b.event_date).getTime() : 0;
    return aDate - bDate;
  });

  if (view === "day") {
    return sorted.filter((event) => event.event_date && isSameDay(parseISO(event.event_date), selected));
  }

  if (view === "week") {
    const start = new Date(selected);
    start.setDate(selected.getDate() - selected.getDay() + 1);
    const end = new Date(selected);
    end.setDate(selected.getDate() - selected.getDay() + 7);
    return sorted.filter((event) => {
      if (!event.event_date) return false;
      const current = parseISO(event.event_date);
      return current >= start && current <= end;
    });
  }

  if (view === "month") {
    return sorted.filter((event) => event.event_date && isSameMonth(parseISO(event.event_date), selected));
  }

  return sorted;
};

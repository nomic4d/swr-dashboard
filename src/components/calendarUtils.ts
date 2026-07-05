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

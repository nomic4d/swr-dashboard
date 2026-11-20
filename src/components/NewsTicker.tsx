import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { restrictedKeywords } from "./CalendarView";

const NewsTicker = () => {
  const { data: events = [] } = useQuery({
    queryKey: ["today-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, title, event_date, location, month").order("event_number");
      if (error) throw error;
      return (data ?? []).filter((event) => {
        const title = (event.title || "").trim().toLowerCase();
        return !restrictedKeywords.some((keyword) => title.includes(keyword));
      });
    },
    staleTime: 120000,
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const todays = events.filter((event) => String(event.event_date || "").slice(0, 10) === today);
  const line = todays.length ? todays : [{ id: "none", title: "", location: "" }];

  const copy = (key: string) => (
    <span key={key} className="px-6">
      {todays.length === 0 ? "TODAY  •  No SWR event is scheduled for today" : line.map((event, index) => {
        const title = event.title || "";
        const highlight = title.toLowerCase().includes("fusion");
        return (
          <span key={`${key}-${event.id || index}`}>
            {index > 0 ? "     •     " : ""}
            TODAY  •  <span className={highlight ? "font-bold text-yellow-300" : undefined}>{title}</span>
            {event.location ? ` at ${event.location}` : ""} is happening today
          </span>
        );
      })}
    </span>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-10 items-center overflow-hidden bg-blue-950 text-white shadow-[0_-2px_8px_rgba(0,0,0,0.15)]">
      <span className="z-10 flex h-full shrink-0 items-center self-stretch bg-red-600 px-3 text-xs font-bold tracking-wide">TODAY</span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="news-ticker-track flex w-max whitespace-nowrap text-sm font-medium">
          {copy("a")}
          {copy("b")}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;

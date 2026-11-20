import { createElement, useState, useEffect, useMemo } from "react";
import { Calendar, Users, Heart, Clock, Wallet, Image, Play, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isFuture } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { restrictedKeywords, themeForEvent, eventPhoto, eventPhotoPosition } from "./CalendarView";
import CalendarEventModal from "./CalendarEventModal";
import { applyEventSchedule } from "./calendarUtils";
import { DUMMY_DONORS } from "@/data/dummyDonors";

const DashboardView = () => {
  const { user } = useAuth();
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_number");
      if (error) throw error;
      return applyEventSchedule((data ?? []).filter((e: any) => { const t = (e.title || "").trim().toLowerCase(); return !restrictedKeywords.some((k) => t.includes(k)); }));
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reminders").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: budgetRows = [] } = useQuery({
    queryKey: ["dashboard-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("allocated_amount, spent_amount");
      if (error) throw error;
      return data ?? [];
    },
  });

  const budgetTotals = useMemo(() => {
    const allocated = budgetRows.reduce((s: number, b: any) => s + Number(b.allocated_amount || 0), 0);
    const consumed = budgetRows.reduce((s: number, b: any) => s + Number(b.spent_amount || 0), 0);
    return { allocated, consumed, remaining: allocated - consumed, pct: allocated > 0 ? (consumed / allocated) * 100 : 0 };
  }, [budgetRows]);

  const { data: galleryAlbums = [] } = useQuery({
    queryKey: ["dashboard-albums"],
    queryFn: async () => {
      const { data } = await supabase.from("albums").select("*").order("created_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const { data: galleryMedia = [] } = useQuery({
    queryKey: ["dashboard-media"],
    queryFn: async () => {
      const { data } = await supabase.from("event_media").select("*").order("created_at", { ascending: false }).limit(12);
      return data ?? [];
    },
  });

  const upcomingEvents = events.filter(e => e.event_date && isFuture(new Date(e.event_date)));

  const pendingReminders = reminders.filter(r => r.status === "pending");

  const stats = [
    {
      label: "Total Events",
      value: events.length,
      icon: Calendar,
      card: "text-white",
      iconBg: "bg-white/20 text-white",
      labelText: "text-white/90",
    },
    {
      label: "Upcoming",
      value: upcomingEvents.length,
      icon: Clock,
      card: "bg-sky-300 text-slate-950",
      iconBg: "bg-sky-700/10 text-sky-900",
      labelText: "text-slate-800",
      slideshow: upcomingEvents.length > 0,
    },
    {
      label: "Staff Members",
      value: staff.length,
      icon: Users,
      card: "text-slate-950",
      iconBg: "bg-emerald-700/10 text-emerald-900",
      labelText: "text-slate-800",
    },
    {
      label: "Top Contributors",
      value: 5,
      icon: Heart,
      card: "text-foreground",
      iconBg: "bg-rose-500/10 text-rose-600",
      labelText: "text-muted-foreground",
      isContributors: true,
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h2 className="text-2xl font-light text-foreground/70">
          Hello, {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening"}, {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Member"}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">SWR Yearly Calendar 2026 Overview</p>
      </div>

      {/* Stats Grid */}
      <EventSlideCard stats={stats} upcomingEvents={upcomingEvents} />

      {/* Bento Grid — 4 columns: 2 + 1 + 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Yearly Calendar - spans 2 */}
        <YearlyCalendar events={events} />

        {/* Gallery Spotlight — full-height with overlay */}
        <SlideShowWidget albums={galleryAlbums} media={galleryMedia} />

        <div className="glass-card rounded-xl p-4 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600"><Wallet className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">SWR Budget</h3>
              <p className="text-xs text-muted-foreground">{budgetTotals.pct.toFixed(1)}% used</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground mt-1">PKR {budgetTotals.allocated.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Consumed</p>
              <p className="text-lg font-bold text-orange-600 mt-1">PKR {budgetTotals.consumed.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">PKR {budgetTotals.remaining.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex flex-1 items-end justify-center overflow-hidden pointer-events-none min-h-[150px]">
            {createElement("dotlottie-wc", {
              src: "https://lottie.host/b94491ad-87ac-4b20-823b-cfbb9167354a/Q0SG8Yhfw0.lottie",
              autoplay: true,
              loop: true,
              style: { width: 190, height: 190 },
            })}
          </div>
          <Progress value={budgetTotals.pct} className="h-2.5" />
        </div>
      </div>
    </div>
  );
};

const EventSlideCard = ({ stats, upcomingEvents }: { stats: any[]; upcomingEvents: any[] }) => {
  const withTheme = useMemo(() =>
    upcomingEvents.map((e: any) => ({
      ...e,
      bg: eventPhoto(e),
      theme: themeForEvent(e),
    })),
  [upcomingEvents]);

  const [slideIdx, setSlideIdx] = useState(0);
  const [slideFade, setSlideFade] = useState(true);

  useEffect(() => {
    if (withTheme.length === 0) return;
    const timer = setInterval(() => {
      setSlideFade(false);
      setTimeout(() => {
        setSlideIdx((prev) => (prev + 1) % withTheme.length);
        setSlideFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [withTheme.length]);

  const current = withTheme[slideIdx];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`${stat.card} rounded-xl p-4 shadow-sm relative overflow-hidden h-full flex flex-col ${stat.slideshow ? "min-h-[168px]" : ""}`}>
          {stat.label === "Total Events" && (
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvo1tZu2DVWXDDXyt4qGzDd8QnBFpmqbXN1-8Y-Z8ojOCDMIkZ6hnDCXk&s=10')", backgroundSize: "cover", backgroundPosition: "center" }} />
          )}
          {stat.label === "Total Events" && (
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          )}
          {stat.label === "Staff Members" && (
            <>
              <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.adb.org/sites/default/files/page/568906/images/life-adb-our-global-offices-cambodia-2025.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0 bg-emerald-300/50 pointer-events-none" />
            </>
          )}
          {stat.slideshow && current?.bg && (
            <img src={current.bg} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${slideFade ? "opacity-100" : "opacity-0"}`} style={{ objectPosition: eventPhotoPosition(current) }} />
          )}
          {stat.slideshow && current && !current.bg && (
            <div className={`absolute inset-0 bg-gradient-to-br ${current.theme.gradient} transition-opacity duration-300 ${slideFade ? "opacity-100" : "opacity-0"}`} />
          )}
          <div className={`relative flex flex-col gap-2 ${stat.isContributors ? "flex-1" : ""}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${stat.slideshow ? "text-white" : stat.labelText}`}>{stat.label}</p>
              <div className={`${stat.slideshow ? "bg-white/20 text-white" : stat.iconBg} p-2 rounded-xl shadow-sm`}>
                <stat.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            {stat.isContributors ? (
              <div className="flex flex-1 flex-col justify-between gap-2 mt-1">
                {DUMMY_DONORS.map((donor, i) => {
                  const c = {
                    name: donor.name,
                    amount: donor.total,
                    color: ["bg-rose-500", "bg-blue-500", "bg-emerald-500", "bg-violet-500"][i] || "bg-slate-500",
                    avatar: donor.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
                  };
                  const maxAmount = DUMMY_DONORS[0]?.total || 1;
                  const pct = (c.amount / maxAmount) * 100;
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${c.color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                        {c.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium truncate">{c.name}</span>
                          <span className="text-muted-foreground shrink-0">Rs.{c.amount.toLocaleString()}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${c.color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : stat.slideshow && withTheme.length > 0 ? (
              <div className={`transition-opacity duration-300 ${slideFade ? "opacity-100" : "opacity-0"}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${current.theme.gradient} flex items-center justify-center shrink-0`}>
                    {(() => { const I = current.theme.icon; return <I className="h-4 w-4 text-white" strokeWidth={2} />; })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white drop-shadow-md truncate">{current.title}</p>
                    <p className="text-[9px] text-white/70">{current.month}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  {withTheme.slice(0, 6).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i === slideIdx ? "bg-white" : "bg-white/30"}`} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const eventsInMonth = (events: any[], month: string) =>
  events.filter((event) => {
    const label = (event.month || "").toLowerCase();
    return label.includes(month.toLowerCase());
  });

const YearlyCalendar = ({ events }: { events: any[] }) => {
  const [selected, setSelected] = useState<any>(null);
  const filled = months
    .map((month) => ({ month, events: eventsInMonth(events, month) }))
    .filter((entry) => entry.events.length > 0);

  return (
    <div className="lg:col-span-2 glass-card rounded-xl p-4" style={{ backgroundColor: "#d6e6fb" }}>
      <h3 className="font-semibold text-slate-950 mb-3">2026 Yearly Calendar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filled.map(({ month, events: monthEvents }) => (
          <div key={month} className="rounded-2xl overflow-hidden shadow-md flex flex-col h-full">
            {monthEvents.map((event: any, index: number) => {
              const theme = themeForEvent(event);
              const Icon = theme.icon;
              return (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => setSelected(event)}
                  className={`relative flex-1 min-h-[76px] bg-gradient-to-br ${theme.gradient} px-3 flex items-center gap-2.5 text-left cursor-pointer transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                >
                  {index === 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider text-white bg-black/15 px-2 py-0.5 rounded-full">
                      {month.slice(0, 3)}
                    </span>
                  )}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/25 shrink-0">
                    <Icon className="h-4 w-4 text-white" strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-bold text-white leading-tight pr-8">{event.title}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <CalendarEventModal
        event={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        canManage={false}
        isEditing={false}
        form={{}}
        onFormChange={() => {}}
        onSave={() => {}}
        onStartEdit={() => {}}
        onCancelEdit={() => {}}
      />
    </div>
  );
};

const SlideShowWidget = ({ albums, media }: { albums: any[]; media: any[] }) => {
  const { data: profiles = [] } = useQuery({
    queryKey: ["dash-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url");
      return data ?? [];
    },
    staleTime: 300000,
  });
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));

  const allItems = useMemo(() => {
    const items: { url: string; album: string; uploader_id: string }[] = [];
    for (const album of albums) {
      const m = media.filter((x: any) => x.album_id === album.id);
      for (const item of m) {
        items.push({ url: item.media_type === "video" ? (item.thumbnail_url || "/placeholder.svg") : item.media_url, album: album.title, uploader_id: item.uploader_id || album.uploader_id });
      }
    }
    return items.slice(0, 8);
  }, [albums, media]);

  const mediaIds = useMemo(() => {
    const ids: string[] = [];
    for (const album of albums) {
      for (const item of media.filter((x: any) => x.album_id === album.id).slice(0, 8)) {
        ids.push(item.id);
      }
    }
    return ids;
  }, [albums, media]);

  const { data: likes = [] } = useQuery({
    queryKey: ["dash-likes", ...mediaIds],
    queryFn: async () => {
      if (mediaIds.length === 0) return [];
      const { data } = await supabase.from("media_likes").select("media_id, user_id").in("media_id", mediaIds);
      return data ?? [];
    },
    enabled: mediaIds.length > 0,
  });

  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (allItems.length === 0) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % allItems.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [allItems.length]);

  if (allItems.length === 0) return null;

  const currentItem = allItems[idx];
  const uploader = currentItem ? profileMap[currentItem.uploader_id] : null;
  const likeCount = currentItem ? likes.filter((l: any) => l.media_id === mediaIds[idx]).length : 0;
  const likers = currentItem ? likes.filter((l: any) => l.media_id === mediaIds[idx]).slice(0, 3) : [];

  return (
    <div className="glass-card rounded-xl overflow-hidden relative flex flex-col min-h-full">
      <div className="relative flex-1 bg-muted min-h-[300px]">
        <img src={currentItem.url} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
        <div className="absolute top-3 left-3 right-3">
          <h3 className="text-white font-bold text-sm drop-shadow-md">Gallery Spotlight</h3>
        </div>
        <div className="absolute top-3 right-3 flex gap-1">
          {allItems.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white scale-110" : "bg-white/40"}`} />
          ))}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5">
          <Avatar className="h-7 w-7 rounded-[6px] border border-white/40">
            <AvatarImage src={uploader?.avatar_url} />
            <AvatarFallback className="text-[8px] rounded-[6px]">{(uploader?.full_name || "U")[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate drop-shadow-md">{uploader?.full_name || "Unknown"}</p>
            <p className="text-[10px] text-white/70 truncate drop-shadow-md">{currentItem.album}</p>
          </div>
          <div className="flex items-center gap-1">
            {likers.length > 0 && (
              <div className="flex -space-x-1.5">
                {likers.map((l: any, li: number) => (
                  <Avatar key={li} className="h-5 w-5 rounded-full border border-white/50">
                    <AvatarImage src={profileMap[l.user_id]?.avatar_url} />
                    <AvatarFallback className="text-[6px] bg-black/40 text-white">{(profileMap[l.user_id]?.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
            <span className="text-[10px] text-white font-medium drop-shadow-md">{likeCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

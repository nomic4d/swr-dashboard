import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Video, Trash2, Lock, Folder, ChevronLeft, ChevronRight, X, Search, Eye, Heart, MessageCircle, Share2, Download, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { eventTheme } from "./CalendarView";
import { filterAndSortGalleryMedia, getVisibleGalleryMedia } from "./galleryUtils";
import { getPortalRole } from "@/pages/portalUtils";
import GalleryUploadDialog from "./GalleryUploadDialog";

const GalleryView = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState<"all" | "photo" | "video">("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "popular" | "featured">("latest");

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: media = [] } = useQuery({
    queryKey: ["event_media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_media").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: galleryModeration = {} } = useQuery({
    queryKey: ["gallery-moderation"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("gallery_moderation").select("media_id, approved, featured");
        if (error) throw error;
        return (data ?? []).reduce((acc: Record<string, { approved?: boolean; featured?: boolean }>, item: any) => {
          acc[item.media_id] = { approved: item.approved, featured: item.featured };
          return acc;
        }, {});
      } catch {
        return {};
      }
    },
  });

  const role = user ? getPortalRole(user.email, (user as any)?.user_metadata?.role) : "member";

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, department, avatar_url").eq("email", user!.email).maybeSingle();
      return data;
    },
  });

  const currentEventId = activeEvent ?? events[0]?.id;
  const canUploadGallery = Boolean(user && (role === "manager" || role === "admin" || role === "staff"));

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event_media"] }); toast.success("Deleted"); },
  });

  const visibleMedia = getVisibleGalleryMedia(media, [], currentEventId, {
    currentUserId: user?.id,
    approvedUploaderIds: [],
    role: user ? (role === "manager" || role === "admin" ? "staff" : "member") : "member",
    canModerate: Boolean(user && (role === "manager" || role === "admin")),
    moderation: galleryModeration,
  });
  const filtered = filterAndSortGalleryMedia(visibleMedia, { query: search, mediaType, sortBy });
  const images = filtered.filter((m) => m.media_type !== "video");

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(() => setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length)), [images.length]);
  const prev = useCallback(() => setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, next, prev, closeLightbox]);

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Shared Media Gallery</h2>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            {user ? <><Folder className="h-3.5 w-3.5 text-blue-500" /> {canUploadGallery ? "Approved team and shared uploads are shown" : "Only approved uploads are visible"}</> : "Photos & videos from each event"}
          </p>
        </div>
        {user ? (
          <>
            <GalleryUploadDialog open={open} onOpenChange={setOpen} events={events} />
            {canUploadGallery ? (
              <Button onClick={() => setOpen(true)} className="gap-2">
                <ImageIcon className="h-4 w-4" /> Upload Media
              </Button>
            ) : (
              <Button variant="outline" className="gap-2" disabled>
                <Lock className="h-4 w-4" /> Awaiting approval
              </Button>
            )}
          </>
        ) : (
          <Link to="/auth"><Button variant="outline" className="gap-2"><Lock className="h-4 w-4" /> Sign in to upload</Button></Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card/60 p-3">
        <div className="flex flex-1 items-center gap-2 rounded-full border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search captions, users, events" className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
        </div>
        <Select value={mediaType} onValueChange={(value) => setMediaType(value as "all" | "photo" | "video")}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Media type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All media</SelectItem>
            <SelectItem value="photo">Photos</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as "latest" | "oldest" | "popular" | "featured")}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={currentEventId} onValueChange={setActiveEvent}>
        <TabsList className="flex-wrap h-auto justify-start gap-2 bg-transparent p-0">
          {events.map((ev) => {
            const t = eventTheme[ev.event_number as number];
            const Icon = t?.icon || ImageIcon;
            const isActive = currentEventId === ev.id;
            const iconColors: Record<number, string> = {
              1: "text-orange-500", 2: "text-emerald-500", 3: "text-sky-500", 4: "text-cyan-500",
              5: "text-indigo-500", 6: "text-amber-500", 7: "text-rose-500", 8: "text-violet-500",
              9: "text-teal-500", 10: "text-blue-500",
            };
            const activeBg: Record<number, string> = {
              1: "bg-gradient-to-r from-orange-400 to-orange-600",
              2: "bg-gradient-to-r from-emerald-400 to-emerald-600",
              3: "bg-gradient-to-r from-sky-400 to-sky-600",
              4: "bg-gradient-to-r from-cyan-400 to-cyan-600",
              5: "bg-gradient-to-r from-indigo-400 to-indigo-600",
              6: "bg-gradient-to-r from-amber-400 to-amber-600",
              7: "bg-gradient-to-r from-rose-400 to-rose-600",
              8: "bg-gradient-to-r from-violet-400 to-violet-600",
              9: "bg-gradient-to-r from-teal-400 to-teal-600",
              10: "bg-gradient-to-r from-blue-400 to-blue-600",
            };
            return (
              <TabsTrigger
                key={ev.id}
                value={ev.id}
                className={`gap-2 rounded-full px-3 py-2 text-xs font-medium border border-border bg-card hover:scale-105 transition-all ${
                  isActive ? `${activeBg[ev.event_number as number]} text-white border-transparent shadow-lg` : ""
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : iconColors[ev.event_number as number] || ""}`} />
                <span>#{ev.event_number} · {ev.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {events.map((ev) => (
          <TabsContent key={ev.id} value={ev.id} className="mt-6">
            {filtered.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
                <Folder className="h-10 w-10 mx-auto mb-3 opacity-40 text-blue-500" />
                <p className="font-medium">No shared media in this folder yet.</p>
                {user && <p className="text-xs mt-2">Uploads will appear here once they are approved and available.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((m) => {
                  const imageIdx = images.findIndex((im) => im.id === m.id);
                  return (
                    <div key={m.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                      {m.media_type === "video" ? (
                        <video src={m.media_url} controls className="aspect-square w-full object-cover bg-muted" />
                      ) : (
                        <button onClick={() => setLightboxIndex(imageIdx)} className="block w-full overflow-hidden cursor-zoom-in">
                          <img src={m.media_url} alt={m.caption || "Event media"} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </button>
                      )}
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3">
                        <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                          {m.media_type === "video" ? "Video" : "Photo"}
                        </span>
                        {Boolean((m as any).featured) && <Star className="h-4 w-4 text-amber-300" />}
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{m.caption || "Untitled media"}</p>
                            <p className="text-xs text-muted-foreground">{m.description || "Shared with the team"}</p>
                          </div>
                          {user?.id === m.uploader_id && (
                            <button onClick={() => deleteMedia.mutate(m.id)} className="rounded-full p-1 text-destructive opacity-0 transition group-hover:opacity-100">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(m as any).views ?? 0}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{(m as any).likes ?? 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{(m as any).comments ?? 0}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-[11px]"><Share2 className="h-3 w-3" />Share</Button>
                          <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-[11px]"><Download className="h-3 w-3" />Save</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Lightbox slideshow */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && closeLightbox()}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0">
          <DialogHeader className="sr-only"><DialogTitle>Image preview</DialogTitle></DialogHeader>
          {lightboxIndex !== null && images[lightboxIndex] && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <button onClick={closeLightbox} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                <X className="h-5 w-5" />
              </button>
              {images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button onClick={next} className="absolute right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              <img
                key={images[lightboxIndex].id}
                src={images[lightboxIndex].media_url}
                alt={images[lightboxIndex].caption || "Preview"}
                className="max-h-[85vh] max-w-full object-contain animate-scale-in"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm flex items-center justify-between">
                <span>{images[lightboxIndex].caption || "Untitled"}</span>
                <span className="text-xs opacity-70">{lightboxIndex + 1} / {images.length}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryView;

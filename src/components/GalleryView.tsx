import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Video, Trash2, Folder, ChevronLeft, ChevronRight, X, Search, User, Camera, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { eventTheme } from "./CalendarView";
import { getPortalRole } from "@/pages/portalUtils";
import GalleryUploadDialog from "./GalleryUploadDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const GalleryView = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState<"all" | "photo" | "video">("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");

  const { data: events = [], error: eventsError } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_number");
      if (error) throw error;
      return (data ?? []).filter((e: any) => e.title !== "Available" && e.title !== "Meeting");
    },
  });

  const { data: media = [], error: mediaError, isLoading } = useQuery({
    queryKey: ["event_media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_media").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url");
      if (error) throw error;
      return data ?? [];
    },
  });

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
  const role = user ? getPortalRole(user.email, (user as any)?.user_metadata?.role) : "member";
  const currentEventId = activeEvent ?? events[0]?.id;
  const canUpload = Boolean(user && (role === "manager" || role === "admin" || role === "staff"));

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event_media"] }); toast.success("Deleted"); },
  });

  const eventMedia = currentEventId ? media.filter((m: any) => m.event_id === currentEventId) : media;

  const albums = eventMedia.reduce((acc: any[], m: any) => {
    let album = acc.find((a) => a.uploader_id === m.uploader_id);
    if (!album) {
      const p = profileMap[m.uploader_id] || {};
      album = {
        uploader_id: m.uploader_id,
        uploader_name: p.full_name || "Unknown",
        avatar_url: p.avatar_url,
        items: [],
      };
      acc.push(album);
    }
    album.items.push(m);
    return acc;
  }, []).sort((a: any, b: any) => b.items.length - a.items.length);

  const openAlbum = (uploaderId: string) => setSelectedAlbum(uploaderId);
  const closeAlbum = () => { setSelectedAlbum(null); setLightboxIndex(null); };

  const albumItems = selectedAlbum
    ? eventMedia.filter((m: any) => m.uploader_id === selectedAlbum)
        .filter((m: any) => {
          if (search) {
            const q = search.toLowerCase();
            if (!(m.caption || "").toLowerCase().includes(q) && !(m.description || "").toLowerCase().includes(q)) return false;
          }
          if (mediaType === "photo" && m.media_type === "video") return false;
          if (mediaType === "video" && m.media_type !== "video") return false;
          return true;
        })
        .sort((a: any, b: any) => sortBy === "oldest"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const albumImages = albumItems.filter((m: any) => m.media_type !== "video");

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(() => setLightboxIndex((i) => (i === null ? null : (i + 1) % albumImages.length)), [albumImages.length]);
  const prev = useCallback(() => setLightboxIndex((i) => (i === null ? null : (i - 1 + albumImages.length) % albumImages.length)), [albumImages.length]);

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
          <h2 className="text-2xl font-bold text-foreground">
            {selectedAlbum ? "Album" : "Gallery"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {user ? "Everyone can upload and view media" : "Photos & videos from each event"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <GalleryUploadDialog open={open} onOpenChange={setOpen} events={events} />
              {canUpload ? (
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <Camera className="h-4 w-4" /> Upload
                </Button>
              ) : (
                <Button variant="outline" className="gap-2" disabled>
                  <Camera className="h-4 w-4" /> Upload
                </Button>
              )}
            </>
          ) : (
            <Link to="/auth"><Button variant="outline" className="gap-2">Sign in to upload</Button></Link>
          )}
        </div>
      </div>

      {(eventsError || mediaError) && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          <p className="font-medium">Failed to load gallery</p>
          <p className="text-xs mt-1">{(eventsError as any)?.message || (mediaError as any)?.message || "Check console for details"}</p>
        </div>
      )}

      {!selectedAlbum && (
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
              {albums.length === 0 ? (
                <div className="rounded-xl p-12 text-center text-muted-foreground border border-dashed">
                  <Folder className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No albums yet</p>
                  {canUpload && <p className="text-xs mt-2">Click Upload to create the first album.</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {albums.map((album: any) => {
                    const cover = album.items[0];
                    const p = profileMap[album.uploader_id] || {};
                    return (
                      <button key={album.uploader_id} onClick={() => openAlbum(album.uploader_id)}
                        className="group text-left rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                          {cover?.media_type === "video" ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground"><Video className="h-10 w-10" /></div>
                          ) : cover?.media_url ? (
                            <img src={cover.media_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>
                          )}
                          <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                            {album.items.length} {album.items.length === 1 ? "photo" : "photos"}
                          </div>
                        </div>
                        <div className="p-3 flex items-center gap-2">
                          <Avatar className="h-8 w-8 border-2 border-background shrink-0">
                            <AvatarImage src={p.avatar_url} />
                            <AvatarFallback className="text-xs">{(p.full_name || "U")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{p.full_name || "Unknown"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{p.email || ""}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {selectedAlbum && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={closeAlbum} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div>
                <p className="text-lg font-bold">{profileMap[selectedAlbum]?.full_name || "Unknown"}'s Album</p>
                <p className="text-xs text-muted-foreground">{albumItems.length} media items</p>
              </div>
            </div>
            {user?.id === selectedAlbum && (
              <Button variant="destructive" size="sm" onClick={() => {
                if (confirm("Delete all media in this album?")) {
                  albumItems.forEach((m: any) => deleteMedia.mutate(m.id));
                }
              }} className="gap-1"><Trash2 className="h-4 w-4" /> Delete Album</Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card/60 p-3">
            <div className="flex flex-1 items-center gap-2 rounded-full border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search in album..." className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
            </div>
            <Select value={mediaType} onValueChange={(v) => setMediaType(v as any)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="photo">Photos</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {albumItems.length === 0 ? (
            <div className="rounded-xl p-12 text-center text-muted-foreground border border-dashed">
              <Folder className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No media found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {albumItems.map((m: any) => {
                const idx = albumImages.findIndex((im: any) => im.id === m.id);
                return (
                  <div key={m.id} className="group relative aspect-square rounded-xl border border-border/50 bg-card overflow-hidden">
                    {m.media_type === "video" ? (
                      <video src={m.media_url} controls className="h-full w-full object-cover" />
                    ) : (
                      <button onClick={() => setLightboxIndex(idx)} className="h-full w-full cursor-zoom-in">
                        <img src={m.media_url} alt={m.caption || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      </button>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-[11px] text-white truncate">{m.caption || ""}</p>
                    </div>
                    {user?.id === m.uploader_id && (
                      <button onClick={() => deleteMedia.mutate(m.id)} className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && closeLightbox()}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0">
          <DialogHeader className="sr-only"><DialogTitle>Preview</DialogTitle></DialogHeader>
          {lightboxIndex !== null && albumImages[lightboxIndex] && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <button onClick={closeLightbox} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><X className="h-5 w-5" /></button>
              {albumImages.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><ChevronLeft className="h-6 w-6" /></button>
                  <button onClick={next} className="absolute right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><ChevronRight className="h-6 w-6" /></button>
                </>
              )}
              <img src={albumImages[lightboxIndex].media_url} alt={albumImages[lightboxIndex].caption || "Preview"} className="max-h-[85vh] max-w-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm flex items-center justify-between">
                <span>{albumImages[lightboxIndex].caption || "Untitled"}</span>
                <span className="text-xs opacity-70">{lightboxIndex + 1} / {albumImages.length}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryView;

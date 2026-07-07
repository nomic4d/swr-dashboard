import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { animatedEmojis } from "@/data/animatedEmojis";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Image as ImageIcon, Video, Trash2, Folder, ChevronLeft, ChevronRight, X, Search, User, Camera, Loader2, LayoutGrid, ScrollText, Play, Heart, MessageCircle, Send, HeartOff, Settings, Minimize2, Move, ZoomIn, Repeat, Smile, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRole } from "@/pages/portalUtils";
import AlbumCreateDialog from "./AlbumCreateDialog";
import GalleryUploadDialog from "./GalleryUploadDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import PlyrVideo from "./PlyrVideo";
import { eventTheme, restrictedKeywords } from "./CalendarView";

const GalleryView = ({ onHeaderChange }: { onHeaderChange?: (h: any) => void }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAlbumCreate, setShowAlbumCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState<any>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [transitionType, setTransitionType] = useState<"fade" | "slide" | "zoom" | "flip">("fade");
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const { data: albums = [], error: albumsError } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data, error } = await supabase.from("albums").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 120000,
  });

  const { data: media = [], error: mediaError } = useQuery({
    queryKey: ["event_media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_media").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 120000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_number");
      if (error) throw error;
      return (data ?? []).filter((e: any) => { const t = (e.title || "").trim().toLowerCase(); return !restrictedKeywords.some((k) => t.includes(k)); });
    },
    staleTime: 120000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, email");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 300000,
  });

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
  const profileByEmail = Object.fromEntries(profiles.filter((p: any) => p.email).map((p: any) => [p.email, p]));
  const role = user ? getPortalRole(user.email, (user as any)?.user_metadata?.role) : "member";
  const canUpload = Boolean(user && (role === "manager" || role === "admin" || role === "staff"));

  const filteredAlbums = eventFilter ? albums.filter((a: any) => a.event_id === eventFilter) : albums;
  const albumMedia = activeAlbum ? media.filter((m: any) => m.album_id === activeAlbum.id) : [];
  const filteredMedia = albumMedia.filter((m: any) => mediaFilter === "all" || m.media_type === mediaFilter);

  const uploaderProfile = activeAlbum ? profileMap[activeAlbum.uploader_id] : null;

  useEffect(() => {
    onHeaderChange?.(activeAlbum ? {
      activeAlbum,
      albumMediaCount: albumMedia.length,
      filteredCount: filteredMedia.length,
      mediaFilter,
      canUpload: canUpload && Boolean(activeAlbum),
      uploaderName: uploaderProfile?.full_name || "Unknown",
      uploaderAvatar: uploaderProfile?.avatar_url || "",
      canDelete: user?.id === activeAlbum.uploader_id,
      onBack: () => { setActiveAlbum(null); setLightboxIndex(null); setSearch(""); },
      onFilter: (f: string) => { setMediaFilter(f as any); setLightboxIndex(null); },
      onUpload: () => setShowUpload(true),
      onDelete: () => { if (confirm("Delete this album?")) deleteAlbum.mutate(activeAlbum.id); },
      transitionType,
      onTransitionChange: (t: string) => setTransitionType(t as any),
    } : null);
  }, [activeAlbum, albumMedia.length, filteredMedia.length, mediaFilter, canUpload, user?.id, uploaderProfile?.full_name, uploaderProfile?.avatar_url, transitionType]);

  const mediaIds = useMemo(() => albumMedia.map((m: any) => m.id), [albumMedia]);

  const { data: likes = [] } = useQuery({
    queryKey: ["media_likes", ...mediaIds],
    queryFn: async () => {
      if (mediaIds.length === 0) return [];
      const { data } = await supabase.from("media_likes").select("id, media_id, user_id").in("media_id", mediaIds);
      return data ?? [];
    },
    enabled: mediaIds.length > 0,
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ["media_comments", ...mediaIds],
    queryFn: async () => {
      if (mediaIds.length === 0) return [];
      const { data } = await supabase.from("media_comments").select("*").in("media_id", mediaIds).order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: mediaIds.length > 0,
    staleTime: 30000,
  });

  const commentIds = useMemo(() => allComments.map((c: any) => c.id), [allComments]);

  const { data: allCommentReactions = [] } = useQuery({
    queryKey: ["comment_reactions", ...commentIds],
    queryFn: async () => {
      if (commentIds.length === 0) return [];
      const { data } = await supabase.from("comment_reactions").select("*").in("comment_id", commentIds);
      return data ?? [];
    },
    enabled: commentIds.length > 0,
    staleTime: 30000,
  });

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event_media"] }); toast.success("Deleted"); },
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("event_media").update({ album_id: null }).eq("album_id", id);
      const { error } = await supabase.from("albums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["albums"] }); queryClient.invalidateQueries({ queryKey: ["event_media"] }); toast.success("Album deleted"); setActiveAlbum(null); },
  });

  const toggleLike = useMutation({
    mutationFn: async (mediaId: string) => {
      if (!user) throw new Error("Not logged in");
      const existing = likes.find((l: any) => l.media_id === mediaId && l.user_id === user.id);
      if (existing) {
        const { error } = await supabase.from("media_likes").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("media_likes").insert({ media_id: mediaId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["media_likes"] }); },
  });

  const addComment = useMutation({
    mutationFn: async ({ mediaId, content }: { mediaId: string; content: string }) => {
      if (!user) throw new Error("Not logged in");
      const { data, error } = await supabase.from("media_comments").insert({
        media_id: mediaId, user_id: user.id, user_email: user.email, content
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData(["media_comments", ...mediaIds], (old: any[]) => [...(old || []), newComment]);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("media_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData(["media_comments", ...mediaIds], (old: any[]) => (old || []).filter((c: any) => c.id !== commentId));
      toast.success("Comment deleted");
    },
  });

  const toggleCommentReaction = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("Not logged in");
      const existing = allCommentReactions.find((r: any) => r.comment_id === commentId && r.user_id === user.id);
      if (existing) {
        const { error } = await supabase.from("comment_reactions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("comment_reactions").insert({
          comment_id: commentId, user_id: user.id, reaction: "like"
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["comment_reactions"] }); },
  });

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(() => { setSlideDir("right"); setLightboxIndex((i) => (i === null ? null : (i + 1) % filteredMedia.length)); }, [filteredMedia.length]);
  const prev = useCallback(() => { setSlideDir("left"); setLightboxIndex((i) => (i === null ? null : (i - 1 + filteredMedia.length) % filteredMedia.length)); }, [filteredMedia.length]);

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

  const currentItem = lightboxIndex !== null ? filteredMedia[lightboxIndex] : null;
  const currentLikes = currentItem ? likes.filter((l: any) => l.media_id === currentItem.id) : [];
  const currentComments = currentItem ? allComments.filter((c: any) => c.media_id === currentItem.id) : [];
  const userLiked = currentItem ? currentLikes.some((l: any) => l.user_id === user?.id) : false;
  const currentCommentIds = useMemo(() => currentComments.map((c: any) => c.id), [currentComments]);
  const currentCommentReactions = currentCommentIds.length > 0
    ? allCommentReactions.filter((r: any) => currentCommentIds.includes(r.comment_id))
    : [];

  return (
    <div className="space-y-2 animate-fade-in">
      {!activeAlbum && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Albums</h2>
            <p className="text-[10px] text-muted-foreground">{filteredAlbums.length} albums</p>
          </div>
          {user && canUpload && (
            <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowAlbumCreate(true)}>
              <Camera className="h-3 w-3" /> Create Album
            </Button>
          )}
        </div>
      )}

      {(albumsError || mediaError) && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300">
          Failed to load: {(albumsError as any)?.message || (mediaError as any)?.message}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <button onClick={() => setShowFilterSidebar(true)}
            className="lg:hidden mb-2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Filter by Event
          </button>

      {!activeAlbum ? (
        filteredAlbums.length === 0 ? (
          <div className="rounded-xl p-12 text-center text-muted-foreground border border-dashed">
            <Folder className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No albums yet</p>
            {canUpload && <p className="text-xs mt-2">Create an album to start uploading.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredAlbums.map((album: any) => {
              const cover = media.find((m: any) => m.album_id === album.id);
              const p = profileMap[album.uploader_id] || {};
              const count = media.filter((m: any) => m.album_id === album.id).length;
              return (
                <button key={album.id} onClick={() => setActiveAlbum(album)}
                  className="group text-left rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {cover ? (
                      <img src={cover.media_type === "video" ? (cover.thumbnail_url || "/placeholder.svg") : cover.media_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground/40">
                        {album.template === "scroll" ? <ScrollText className="h-10 w-10" /> : <LayoutGrid className="h-10 w-10" />}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur flex items-center gap-1">
                      {album.template === "scroll" ? <ScrollText className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
                      {count}
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shrink-0">
                      <AvatarImage src={p.avatar_url} />
                      <AvatarFallback className="text-sm">{(p.full_name || "U")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{album.title}</p>
                      <p className="text-xs text-muted-foreground truncate">Uploaded by {p.full_name || "Unknown"}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-2">


          <div className="flex items-center gap-1.5 rounded-xl border bg-card/60 px-2 py-1.5">
            <div className="flex items-center gap-1 shrink-0">
              {(["all", "image", "video"] as const).map((f) => (
                <button key={f} onClick={() => { setMediaFilter(f); setLightboxIndex(null); }}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${mediaFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  {f === "all" ? "All" : f === "image" ? "Photos" : "Videos"}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-0.5">{filteredMedia.length} items</span>
            </div>
            <span className="text-muted-foreground/30 mx-0.5 shrink-0">|</span>
            <Search className="h-3 w-3 text-muted-foreground shrink-0" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search in album..." className="border-0 bg-transparent shadow-none h-6 text-[10px] focus-visible:ring-0" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuLabel className="text-xs py-1">Transition</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["fade", "slide", "zoom", "flip"].map((t) => (
                  <DropdownMenuItem key={t} onClick={() => setTransitionType(t as any)}
                    className={`text-xs gap-2 ${transitionType === t ? "bg-primary/10 text-primary font-semibold" : ""}`}
                  >
                    {t === "fade" ? <Minimize2 className="h-3.5 w-3.5" /> : t === "slide" ? <Move className="h-3.5 w-3.5" /> : t === "zoom" ? <ZoomIn className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {user && canUpload && (
              <Button size="sm" className="h-7 px-2 gap-1 text-xs rounded-[5px]" onClick={() => setShowUpload(true)}>
                <Camera className="h-3 w-3" /> Upload
              </Button>
            )}
          </div>

          {activeAlbum.template === "scroll" ? (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {filteredMedia
                .filter((m: any) => !search || (m.caption || "").toLowerCase().includes(search.toLowerCase()))
                .map((m: any, idx: number) => (
                  <div key={m.id} className="group relative shrink-0 w-48 aspect-square rounded-xl border bg-card overflow-hidden">
                    <button onClick={() => setLightboxIndex(idx)} className="h-full w-full">
                      {m.media_type === "video" ? (
                        <div className="h-full w-full relative">
                          <img src={m.thumbnail_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-10 w-10 text-white/80" />
                          </div>
                        </div>
                      ) : (
                        <img src={m.media_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      )}
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-[10px] text-white truncate">{m.caption || ""}</p>
                      {m.media_date && <p className="text-[9px] text-white/70">{m.media_date}{m.media_time ? ` ${m.media_time}` : ""}</p>}
                    </div>
                    {user?.id === m.uploader_id && (
                      <button onClick={() => deleteMedia.mutate(m.id)} className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600"><X className="h-3 w-3" /></button>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredMedia
                .filter((m: any) => !search || (m.caption || "").toLowerCase().includes(search.toLowerCase()))
                .map((m: any, idx: number) => (
                  <div key={m.id} className="group relative aspect-square rounded-xl border bg-card overflow-hidden">
                    <button onClick={() => setLightboxIndex(idx)} className="h-full w-full">
                      {m.media_type === "video" ? (
                        <div className="h-full w-full relative">
                          <img src={m.thumbnail_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-10 w-10 text-white/80" />
                          </div>
                        </div>
                      ) : (
                        <img src={m.media_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      )}
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-[10px] text-white truncate">{m.caption || ""}</p>
                      {m.media_date && <p className="text-[9px] text-white/70">{m.media_date}{m.media_time ? ` ${m.media_time}` : ""}</p>}
                    </div>
                    {user?.id === m.uploader_id && (
                      <button onClick={() => deleteMedia.mutate(m.id)} className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600"><X className="h-3 w-3" /></button>
                    )}
                  </div>
                ))}
            </div>
          )}

          {filteredMedia.length === 0 && (
            <div className="rounded-xl p-12 text-center text-muted-foreground border border-dashed">
              <Folder className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No {mediaFilter !== "all" ? mediaFilter + "s" : "media"} in this album</p>
              <p className="text-xs mt-2">Click Upload to add photos and videos.</p>
            </div>
          )}
        </div>
      )}
        </div>

        {/* Left sidebar filter */}
        <div className={`${showFilterSidebar ? "fixed inset-0 z-40 lg:relative lg:inset-auto" : "hidden lg:block"} lg:w-56 shrink-0`}>
          <div className={`${showFilterSidebar ? "absolute inset-0 bg-black/40 lg:hidden" : ""}`} onClick={() => setShowFilterSidebar(false)} />
          <div className={`${showFilterSidebar ? "absolute left-0 top-0 h-full w-56 bg-card border-r shadow-xl lg:relative lg:shadow-none" : ""} lg:block p-2 space-y-1 rounded-xl border bg-card/60 max-h-[calc(100vh-8rem)] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Events</span>
              <button onClick={() => setShowFilterSidebar(false)} className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
            <button onClick={() => { setEventFilter(null); setShowFilterSidebar(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${eventFilter === null ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <div className="w-7 h-7 rounded-lg bg-muted-foreground/20 flex items-center justify-center shrink-0">
                <ImageIcon className="h-3.5 w-3.5" />
              </div>
              All Events
            </button>
            {events.map((e: any) => {
              const theme = eventTheme[e.event_number as number];
              const Icon = theme?.icon || ImageIcon;
              const isActive = eventFilter === e.id;
              return (
                <button key={e.id} onClick={() => { setEventFilter(isActive ? null : e.id); setShowFilterSidebar(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? "text-white shadow-sm bg-gradient-to-br " + theme?.gradient : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-white/20" : "bg-gradient-to-br " + (theme?.gradient || "from-gray-400 to-gray-600")}`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="truncate">{e.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AlbumCreateDialog
        open={showAlbumCreate}
        onOpenChange={setShowAlbumCreate}
        events={events}
        onAlbumCreated={(album) => { setShowAlbumCreate(false); setActiveAlbum(album); setShowUpload(true); }}
      />

      {activeAlbum && (
        <GalleryUploadDialog
          open={showUpload}
          onOpenChange={setShowUpload}
          events={events}
          albumId={activeAlbum.id}
          defaultEventId={activeAlbum.event_id}
        />
      )}

      {/* Instagram-style Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && closeLightbox()}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0 rounded-[15px] overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>Preview</DialogTitle></DialogHeader>
          {currentItem && (
            <div className="flex flex-col md:flex-row max-h-[80vh]">
              {/* Left: Photo/Video */}
              <div className="relative flex-1 flex items-center justify-center bg-black min-h-[40vh] md:min-h-[70vh]">
                <button onClick={closeLightbox} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"><X className="h-5 w-5" /></button>
                {user?.id === currentItem.uploader_id && (
                  <button onClick={() => { closeLightbox(); deleteMedia.mutate(currentItem.id); }} className="absolute top-3 left-3 z-10 p-2 rounded-full bg-black/50 hover:bg-red-600 text-white"><Trash2 className="h-4 w-4" /></button>
                )}
                {filteredMedia.length > 1 && (
                  <>
                    <button onClick={prev} className="absolute left-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"><ChevronLeft className="h-6 w-6" /></button>
                    <button onClick={next} className="absolute right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"><ChevronRight className="h-6 w-6" /></button>
                  </>
                )}
                {currentItem.media_type === "video" ? (
                  <PlyrVideo src={currentItem.media_url} poster={currentItem.thumbnail_url} />
                ) : (
                  <img key={lightboxIndex + transitionType + slideDir} src={currentItem.media_url} alt={currentItem.caption || ""}
                    className={`max-h-[85vh] max-w-full object-contain ${transitionType === "fade" ? "animate-fadeIn" : transitionType === "slide" ? (slideDir === "right" ? "animate-slideInRight" : "animate-slideInLeft") : transitionType === "zoom" ? "animate-zoomIn" : "animate-flipIn"}`}
                  />
                )}
                <div className="absolute bottom-3 left-3 text-[11px] text-white/60">{lightboxIndex + 1} / {filteredMedia.length}</div>
              </div>

              {/* Right: Likes & Comments (Instagram style) */}
              <div className="w-full md:w-80 bg-card flex flex-col border-l border-border/50">
                {/* Header */}
                <div className="flex items-center gap-2.5 p-3 border-b border-border/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileMap[currentItem.uploader_id]?.avatar_url} />
                    <AvatarFallback className="text-xs">{(profileMap[currentItem.uploader_id]?.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{profileMap[currentItem.uploader_id]?.full_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">{currentItem.media_date || ""}{currentItem.media_time ? ` ${currentItem.media_time}` : ""}</p>
                  </div>
                </div>

                {/* Caption */}
                {currentItem.caption && (
                  <div className="px-3 py-2 border-b border-border/30">
                    <p className="text-xs text-foreground/80">{currentItem.caption}</p>
                  </div>
                )}

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0 max-h-[40vh]">
                  {currentComments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No comments yet</p>
                  ) : (
                    currentComments.map((c: any) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                          <AvatarImage src={profileByEmail[c.user_email]?.avatar_url} />
                          <AvatarFallback className="text-[9px]">{(profileByEmail[c.user_email]?.full_name || "U")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs">
                            <span className="font-semibold">{profileByEmail[c.user_email]?.full_name || "Unknown"}</span>{" "}
                            <span className="text-muted-foreground">{c.content}</span>
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                            {new Date(c.created_at).toLocaleDateString()}
                            <button onClick={() => toggleCommentReaction.mutate(c.id)}
                              className={`inline-flex items-center gap-0.5 hover:scale-110 transition-transform ${
                                allCommentReactions.some((r: any) => r.comment_id === c.id && r.user_id === user?.id)
                                  ? "text-red-500" : "text-muted-foreground/50 hover:text-red-400"
                              }`}
                            >
                              <Heart className={`h-3 w-3 ${allCommentReactions.some((r: any) => r.comment_id === c.id && r.user_id === user?.id) ? "fill-current" : ""}`} />
                              <span>{allCommentReactions.filter((r: any) => r.comment_id === c.id).length}</span>
                            </button>
                            {user?.id === c.user_id && (
                              <button onClick={() => deleteComment.mutate(c.id)} className="ml-1 text-destructive/60 hover:text-destructive">Delete</button>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Likes row */}
                <div className="px-3 py-2 border-t border-border/50 flex items-center gap-3">
                  <button onClick={() => user && toggleLike.mutate(currentItem.id)} className={`transition-colors ${userLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                    {userLiked ? <Heart className="h-5 w-5 fill-current" /> : <Heart className="h-5 w-5" />}
                  </button>
                  <span className="text-xs font-medium">{currentLikes.length} {currentLikes.length === 1 ? "like" : "likes"}</span>
                  {/* Avatar stack */}
                  {currentLikes.length > 0 && (
                    <div className="flex -space-x-2 ml-auto">
                      {currentLikes.slice(0, 5).map((l: any) => {
                        const p = profileMap[l.user_id] || {};
                        return (
                          <Avatar key={l.id} className="h-6 w-6 border-2 border-card ring-1 ring-border/30">
                            <AvatarImage src={p.avatar_url} />
                            <AvatarFallback className="text-[8px]">{(p.full_name || "U")[0]}</AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {currentLikes.length > 5 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground border-2 border-card">+{currentLikes.length - 5}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Add comment */}
                {user && (
                  <div className="flex items-center gap-2 border-t border-border/50 p-3">
                    <Input value={commentInputs[currentItem.id] || ""} onChange={(e) => setCommentInputs((prev) => ({ ...prev, [currentItem.id]: e.target.value }))}
                      placeholder="Add a comment..." className="h-8 text-xs border-0 bg-muted/50 rounded-lg" onKeyDown={(e) => {
                        if (e.key === "Enter" && (commentInputs[currentItem.id] || "").trim()) {
                          addComment.mutate({ mediaId: currentItem.id, content: commentInputs[currentItem.id].trim() });
                          setCommentInputs((prev) => ({ ...prev, [currentItem.id]: "" }));
                        }
                      }}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors"><Smile className="h-4 w-4" /></button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="end" className="w-[280px] p-2 border-border/50">
                        <div className="grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto">
                          {animatedEmojis.map((ae) => (
                            <button key={ae.name} onClick={() => setCommentInputs((prev) => ({ ...prev, [currentItem.id]: (prev[currentItem.id] || "") + ae.emoji }))}
                              className="p-1 rounded-md hover:bg-muted transition-colors flex items-center justify-center"
                              title={ae.name}
                            >
                              <img src={ae.url} alt={ae.name} className="h-7 w-7 object-contain" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <button disabled={!(commentInputs[currentItem.id] || "").trim()} onClick={() => {
                      addComment.mutate({ mediaId: currentItem.id, content: commentInputs[currentItem.id].trim() });
                      setCommentInputs((prev) => ({ ...prev, [currentItem.id]: "" }));
                    }} className="text-primary disabled:text-muted-foreground"><Send className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryView;

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, Lock, Pencil, Image as ImageIcon, Folder, Loader2, ArrowLeft, ChevronLeft, ChevronRight, X, Trash2, Play } from "lucide-react";
import { format } from "date-fns";
import PlyrVideo from "./PlyrVideo";

const ProfileView = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editAlbum, setEditAlbum] = useState<any>(null);
  const [editAlbumTitle, setEditAlbumTitle] = useState("");
  const [editAlbumTemplate, setEditAlbumTemplate] = useState("grid");
  const [editMedia, setEditMedia] = useState<any>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editMediaDate, setEditMediaDate] = useState("");
  const [editMediaTime, setEditMediaTime] = useState("");

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["my-profile-full"],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, department, role, is_approved, avatar_url, cover_url, created_at")
        .eq("email", user.email)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: albums = [] } = useQuery({
    queryKey: ["my-albums", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("albums").select("*, event:event_id(title, event_number)").eq("uploader_id", user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 120000,
  });

  const { data: albumMedia = [] } = useQuery({
    queryKey: ["album-media", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum?.id) return [];
      const { data } = await supabase.from("event_media").select("*").eq("album_id", selectedAlbum.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!selectedAlbum?.id,
    staleTime: 120000,
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ["my-contributions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("contributions").select("*, campaign:campaign_id(title)").eq("contributor_id", user.id).order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 120000,
  });

  const allMedia = albumMedia;
  const images = allMedia.filter((m: any) => m.media_type !== "video");
  const closeLightbox = () => setLightboxIndex(null);
  const next = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % allMedia.length));
  const prev = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + allMedia.length) % allMedia.length));

  const updateProfile = useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.email || !profile?.id) return;
      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile-full"] });
      toast.success("Profile updated");
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["album-media", selectedAlbum?.id] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMedia = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("event_media").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album-media", selectedAlbum?.id] });
      toast.success("Updated");
      setEditMedia(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("event_media").update({ album_id: null }).eq("album_id", id);
      const { error } = await supabase.from("albums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-albums", user?.id] });
      toast.success("Album deleted");
      setEditAlbum(null);
      if (selectedAlbum?.id === editAlbum?.id) setSelectedAlbum(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAlbum = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("albums").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-albums", user?.id] });
      toast.success("Album updated");
      setEditAlbum(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("staff-avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("staff-avatars").getPublicUrl(path);
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      refetchProfile();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const uploadCover = async (file: File) => {
    if (!user?.id) return;
    setCoverUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `covers/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("staff-avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("staff-avatars").getPublicUrl(path);
      await updateProfile.mutateAsync({ cover_url: publicUrl });
      refetchProfile();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed");
      setPwOpen(false);
      setNewPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPwBusy(false);
    }
  };

  const initials = (profile?.full_name || user?.email || "U").charAt(0).toUpperCase();

  if (!user) return <div className="p-4 text-sm text-muted-foreground">Sign in to view profile</div>;

  return (
    <div className="animate-fade-in">
      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card">
        <div
          className="h-48 bg-gradient-to-r from-indigo-700 via-violet-600 to-purple-600 relative group"
          style={profile?.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
          <button onClick={() => coverInputRef.current?.click()} disabled={coverUploading} className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-opacity">
            {coverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <div className="absolute top-4 left-4 z-10">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">{profile?.full_name || user.email?.split("@")[0] || "User"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] uppercase tracking-wide bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium backdrop-blur-sm">{profile?.role || "staff"}</span>
              <span className="text-xs text-white/80">{user.email}</span>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative group shrink-0">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              <Avatar className="h-20 w-20 ring-4 ring-background">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">{initials}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
            </div>
            <Dialog open={editing} onOpenChange={setEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Full name</Label>
                    <Input className="h-8 text-xs" value={fullName || profile?.full_name || ""} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Input className="h-8 text-xs" value={department || profile?.department || ""} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
                  </div>
                  <Button size="sm" className="w-full" onClick={() => updateProfile.mutate({ full_name: fullName || profile?.full_name, department: department || profile?.department })}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {profile?.department && <span>{profile.department}</span>}
            {profile?.created_at && <span>Member since {format(new Date(profile.created_at), "MMM yyyy")}</span>}
            <span>{profile?.is_approved ? "Approved" : "Pending"}</span>
          </div>
        </div>
      </div>

      {selectedAlbum ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setSelectedAlbum(null); setLightboxIndex(null); }}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back to albums
            </Button>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => { if (confirm("Delete this album and unlink media?")) deleteAlbum.mutate(selectedAlbum.id); }}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Album
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Folder className="h-4 w-4" /> {selectedAlbum.title}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Event #{selectedAlbum.event?.event_number} · {selectedAlbum.template} layout · {albumMedia.length} media
              </p>
            </div>
          </div>
          {albumMedia.length === 0 ? (
            <div className="rounded-xl p-12 text-center text-muted-foreground border border-dashed">
              <Folder className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No media in this album</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {allMedia.map((m: any, idx: number) => (
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
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditMedia(m); setEditCaption(m.caption || ""); setEditMediaDate(m.media_date || ""); setEditMediaTime(m.media_time || ""); }}
                        className="p-1 rounded-full bg-black/50 text-white hover:bg-blue-600"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => { if (confirm("Delete this media?")) deleteMedia.mutate(m.id); }}
                        className="p-1 rounded-full bg-black/50 text-white hover:bg-red-600"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2"><Folder className="h-4 w-4" /> My Albums</h3>
            {albums.length === 0 ? (
              <p className="text-xs text-muted-foreground">No albums created yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {albums.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                    <button onClick={() => setSelectedAlbum(a)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">Event #{a.event?.event_number} · {a.template}</p>
                      </div>
                    </button>
                    <button onClick={() => { setEditAlbum(a); setEditAlbumTitle(a.title); setEditAlbumTemplate(a.template); }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm("Delete album?")) deleteAlbum.mutate(a.id); }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2"><Camera className="h-4 w-4" /> Contributions</h3>
            {contributions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No contributions yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {contributions.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <div className="h-10 w-10 rounded-md bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">PKR</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold">{c.campaign?.title || "—"}</p>
                      <p className="text-[11px] font-bold text-primary">Rs. {Number(c.amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 rounded-xl border border-border/50 bg-card p-4">
        <h3 className="text-sm font-bold mb-3">Account</h3>
        <div className="flex flex-wrap gap-2">
          <Dialog open={pwOpen} onOpenChange={setPwOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Change Password</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label className="text-xs">New password</Label>
                  <Input className="h-8 text-xs" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} />
                </div>
                <Button size="sm" className="w-full" onClick={handleChangePassword} disabled={pwBusy}>
                  {pwBusy && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Album Dialog */}
      <Dialog open={!!editAlbum} onOpenChange={(o) => { if (!o) setEditAlbum(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Album</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input className="h-8 text-xs" value={editAlbumTitle} onChange={(e) => setEditAlbumTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Template</Label>
              <Select value={editAlbumTemplate} onValueChange={setEditAlbumTemplate}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="scroll">Scroll</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="w-full" onClick={() => updateAlbum.mutate({ id: editAlbum.id, updates: { title: editAlbumTitle, template: editAlbumTemplate } })}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={!!editMedia} onOpenChange={(o) => { if (!o) setEditMedia(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Media</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Caption</Label>
              <Input className="h-8 text-xs" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input className="h-8 text-xs" type="date" value={editMediaDate} onChange={(e) => setEditMediaDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input className="h-8 text-xs" type="time" value={editMediaTime} onChange={(e) => setEditMediaTime(e.target.value)} />
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={() => updateMedia.mutate({ id: editMedia.id, updates: { caption: editCaption || null, media_date: editMediaDate || null, media_time: editMediaTime || null } })}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && closeLightbox()}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0 rounded-[15px] overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>Preview</DialogTitle></DialogHeader>
          {lightboxIndex !== null && allMedia[lightboxIndex] && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <button onClick={closeLightbox} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><X className="h-5 w-5" /></button>
              {allMedia.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><ChevronLeft className="h-6 w-6" /></button>
                  <button onClick={next} className="absolute right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><ChevronRight className="h-6 w-6" /></button>
                </>
              )}
              {allMedia[lightboxIndex].media_type === "video" ? (
                <PlyrVideo src={allMedia[lightboxIndex].media_url} poster={allMedia[lightboxIndex].thumbnail_url} />
              ) : (
                <img src={allMedia[lightboxIndex].media_url} alt={allMedia[lightboxIndex].caption || ""} className="max-h-[85vh] max-w-full object-contain" />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm flex items-center justify-between">
                <span>{allMedia[lightboxIndex].caption || "Untitled"}</span>
                <span className="text-xs opacity-70">{lightboxIndex + 1} / {allMedia.length}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileView;

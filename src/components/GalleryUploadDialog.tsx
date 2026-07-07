import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, X, Image, Video, Loader2, CheckCircle2, AlertCircle, Film } from "lucide-react";

interface FileItem {
  id: string;
  file: File;
  preview: string;
  thumbnailFile?: File;
  thumbnailPreview?: string;
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

const generateVideoThumbnail = (file: File): Promise<{ file: File; preview: string }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => { URL.revokeObjectURL(url); video.remove(); };

    video.onloadeddata = () => {
      const seekTo = Math.min(1, video.duration * 0.2);
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanup();
          if (!blob) { reject(new Error("Thumbnail failed")); return; }
          const thumbFile = new File([blob], "thumb.jpg", { type: "image/jpeg" });
          resolve({ file: thumbFile, preview: URL.createObjectURL(blob) });
        }, "image/jpeg", 0.8);
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    video.onerror = () => { cleanup(); reject(new Error("Video load failed")); };
  });
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  events: any[];
  albumId?: string;
  defaultEventId?: string;
}

const GalleryUploadDialog = ({ open, onOpenChange, events, albumId, defaultEventId }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [caption, setCaption] = useState("");
  const [mediaDate, setMediaDate] = useState(new Date().toISOString().split("T")[0]);
  const [mediaTime, setMediaTime] = useState("");

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const entries = Array.from(incoming);
    const newFiles: FileItem[] = entries.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith("video") ? "" : URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < entries.length; i++) {
      const file = entries[i];
      if (file.type.startsWith("video")) {
        const itemId = newFiles[i].id;
        generateVideoThumbnail(file).then(({ file: thumbFile, preview }) => {
          setFiles((prev) => prev.map((f) => f.id === itemId ? { ...f, thumbnailFile: thumbFile, thumbnailPreview: preview } : f));
        }).catch(() => { setFiles((prev) => prev.map((f) => f.id === itemId ? { ...f, thumbnailFile: undefined } : f)); });
      }
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      if (item?.thumbnailPreview) URL.revokeObjectURL(item.thumbnailPreview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const setThumbnail = useCallback((fileId: string, thumbFile: File) => {
    setFiles((prev) => prev.map((f) =>
      f.id === fileId ? { ...f, thumbnailFile: thumbFile, thumbnailPreview: URL.createObjectURL(thumbFile) } : f
    ));
  }, []);

  const totalSize = files.reduce((s, f) => s + f.file.size, 0);
  const doneCount = files.filter((f) => f.status === "done").length;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const targetEventId = defaultEventId || events[0]?.id;
      if (!targetEventId) throw new Error("No event selected");

      let done = 0;
      let firstError: string | null = null;
      for (const fileItem of files) {
        if (fileItem.status === "done") { done++; continue; }
        setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, status: "uploading" as const } : f));

        try {
          const ext = fileItem.file.name.split(".").pop();
          const albumFolder = albumId || "no-album";
          const path = `${user.id}/${albumFolder}/${fileItem.id}.${ext}`;

          const { error: upErr } = await supabase.storage.from("event-media").upload(path, fileItem.file, {
            cacheControl: "3600",
            upsert: true,
          });
          if (upErr) throw upErr;

          const { data: { publicUrl } } = supabase.storage.from("event-media").getPublicUrl(path);
          const mediaType = fileItem.file.type.startsWith("video") ? "video" : "image";

          let thumbnailUrl: string | null = null;
          if (fileItem.thumbnailFile) {
            const thumbExt = fileItem.thumbnailFile.name.split(".").pop();
            const thumbPath = `${user.id}/${albumFolder}/${fileItem.id}_thumb.${thumbExt}`;
            const { error: thumbErr } = await supabase.storage.from("event-media").upload(thumbPath, fileItem.thumbnailFile, {
              cacheControl: "3600",
              upsert: true,
            });
            if (!thumbErr) {
              thumbnailUrl = supabase.storage.from("event-media").getPublicUrl(thumbPath).data.publicUrl;
            }
          }

          const { error: insErr } = await supabase.from("event_media").insert({
            event_id: targetEventId,
            album_id: albumId || null,
            media_url: publicUrl,
            media_type: mediaType,
            thumbnail_url: thumbnailUrl,
            caption: caption || null,
            media_date: mediaDate || null,
            media_time: mediaTime || null,
            uploader_id: user.id,
          });
          if (insErr) throw insErr;

          done++;
          setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, status: "done" as const } : f));
        } catch (e: any) {
          if (!firstError) firstError = e.message;
          setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, status: "error" as const, errorMessage: e.message } : f));
        }
      }
      if (done === 0 && firstError) throw new Error(firstError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_media"] });
      const uploaded = files.filter((f) => f.status === "done").length;
      toast.success(`Uploaded ${uploaded || files.length} file(s)`);
      setFiles([]);
      setCaption("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-4 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs font-medium">Click or drag files here</p>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {files.map((item) => (
                <div key={item.id} className="group relative aspect-square rounded-lg border bg-muted overflow-hidden">
                  {item.file.type.startsWith("video") ? (
                    <div className="flex items-center justify-center h-full">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : (
                    <img src={item.preview} alt="" className="h-full w-full object-cover" />
                  )}
                  <button onClick={() => removeFile(item.id)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600"><X className="h-2.5 w-2.5" /></button>
                  {item.status === "done" && <CheckCircle2 className="absolute bottom-1 right-1 h-3.5 w-3.5 text-green-500" />}
                  {item.status === "error" && <AlertCircle title={item.errorMessage || "Upload failed"} className="absolute bottom-1 right-1 h-3.5 w-3.5 text-red-500" />}
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Caption</Label>
                <Input className="h-7 text-xs" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input className="h-7 text-xs" type="date" value={mediaDate} onChange={(e) => setMediaDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time (optional)</Label>
                  <Input className="h-7 text-xs" type="time" value={mediaTime} onChange={(e) => setMediaTime(e.target.value)} />
                </div>
              </div>

              {files.some((f) => f.file.type.startsWith("video")) && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1.5"><Film className="h-3.5 w-3.5" /> Video Thumbnails (auto from timeline)</p>
                  {files.filter((f) => f.file.type.startsWith("video")).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.thumbnailPreview ? (
                        <img src={item.thumbnailPreview} alt="" className="h-10 w-14 rounded object-cover border" />
                      ) : (
                        <div className="h-10 w-14 rounded bg-muted flex items-center justify-center text-muted-foreground border"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs truncate">{item.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.thumbnailFile ? "Thumbnail set" : "Generating..."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {files.some((f) => f.status === "uploading") && <Progress value={(doneCount / files.length) * 100} className="h-1.5" />}

          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={files.length === 0 || files.every((f) => f.status === "done") || uploadMutation.isPending}
            size="sm"
            className="w-full gap-2"
          >
            {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadMutation.isPending ? `${doneCount}/${files.length}` : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryUploadDialog;

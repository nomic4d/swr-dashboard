import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, X, Image, Video, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const GalleryUploadDialog = ({ open, onOpenChange, events }: { open: boolean; onOpenChange: (o: boolean) => void; events: any[] }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadEventId, setUploadEventId] = useState("");
  const [globalCaption, setGlobalCaption] = useState("");

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newFiles: FileItem[] = Array.from(incoming).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith("video") ? "" : URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const totalSize = files.reduce((s, f) => s + f.file.size, 0);
  const doneCount = files.filter((f) => f.status === "done").length;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const targetEventId = uploadEventId || events[0]?.id;
      if (!targetEventId || !user) throw new Error("Select an event");

      for (const fileItem of files) {
        if (fileItem.status === "done") continue;
        setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, status: "uploading" as const } : f));

        try {
          const ext = fileItem.file.name.split(".").pop();
          const path = `${user.id}/${targetEventId}/${fileItem.id}.${ext}`;

          const { error: upErr } = await supabase.storage.from("event-media").upload(path, fileItem.file, {
            cacheControl: "3600",
            upsert: false,
          });
          if (upErr) throw upErr;

          const { data: { publicUrl } } = supabase.storage.from("event-media").getPublicUrl(path);
          const mediaType = fileItem.file.type.startsWith("video") ? "video" : "image";

          const { error: insErr } = await supabase.from("event_media").insert({
            event_id: targetEventId,
            media_url: publicUrl,
            media_type: mediaType,
            caption: globalCaption || null,
            uploader_id: user.id,
          });
          if (insErr) throw insErr;

          setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, status: "done" as const } : f));
        } catch (e: any) {
          setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, status: "error" as const, errorMessage: e.message } : f));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_media"] });
      toast.success(`Uploaded ${doneCount} file(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>Share photos and videos to the event gallery</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Event selection */}
          <div className="space-y-1.5">
            <Label>Event</Label>
            <Select value={uploadEventId} onValueChange={setUploadEventId}>
              <SelectTrigger><SelectValue placeholder="Select an event" /></SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    #{ev.event_number} · {ev.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-5 hover:border-blue-400/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="rounded-full bg-muted p-3 mb-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Click or drag files here</p>
            <p className="text-xs text-muted-foreground">Images & videos accepted</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{files.length} file{files.length > 1 ? "s" : ""} ({formatSize(totalSize)})</p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Add more</Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {files.map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-lg border bg-muted overflow-hidden">
                    {item.file.type.startsWith("video") ? (
                      <div className="flex items-center justify-center h-full"><Video className="h-8 w-8 text-muted-foreground" /></div>
                    ) : (
                      <img src={item.preview} alt="" className="h-full w-full object-cover" />
                    )}
                    <button onClick={() => removeFile(item.id)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600">
                      <X className="h-3 w-3" />
                    </button>
                    {item.status === "done" && <CheckCircle2 className="absolute bottom-1 right-1 h-4 w-4 text-green-500" />}
                    {item.status === "error" && <AlertCircle className="absolute bottom-1 right-1 h-4 w-4 text-red-500" />}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Single caption for all files */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              <Label>Caption (applies to all files)</Label>
              <Input
                value={globalCaption}
                onChange={(e) => setGlobalCaption(e.target.value)}
                placeholder="Write a caption for your upload..."
              />
            </div>
          )}

          {/* Progress */}
          {files.some((f) => f.status === "uploading") && (
            <Progress value={(doneCount / files.length) * 100} className="h-2" />
          )}

          {/* Upload button */}
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={files.length === 0 || files.every((f) => f.status === "done") || uploadMutation.isPending}
            className="w-full gap-2"
          >
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadMutation.isPending ? `Uploading ${doneCount}/${files.length}` : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryUploadDialog;

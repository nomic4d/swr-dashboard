import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Image, LayoutGrid, ScrollText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  events: any[];
  onAlbumCreated: (album: any) => void;
}

export default function AlbumCreateDialog({ open, onOpenChange, events, onAlbumCreated }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [template, setTemplate] = useState<"scroll" | "grid">("grid");

  const createAlbum = useMutation({
    mutationFn: async () => {
      if (!user || !title || !eventId) throw new Error("Fill all fields");
      const { data, error } = await supabase.from("albums").insert({
        title,
        event_id: eventId,
        uploader_id: user.id,
        template,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["event_media"] });
      toast.success(`Album "${title}" created`);
      setTitle("");
      setEventId("");
      setTemplate("grid");
      onAlbumCreated(data);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" /> Create Album
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Album Title</Label>
            <Input className="h-8 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Orange Fest 2026" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Event</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>#{ev.event_number} · {ev.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Template</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplate("grid")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors",
                  template === "grid" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <LayoutGrid className="h-6 w-6" />
                <span className="text-xs font-medium">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setTemplate("scroll")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors",
                  template === "scroll" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <ScrollText className="h-6 w-6" />
                <span className="text-xs font-medium">Scroll</span>
              </button>
            </div>
          </div>
          <Button
            className="w-full gap-2"
            size="sm"
            onClick={() => createAlbum.mutate()}
            disabled={!title || !eventId || createAlbum.isPending}
          >
            {createAlbum.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            Create Album
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

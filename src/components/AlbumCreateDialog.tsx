import { useEffect, useState } from "react";
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
import { albumTitleForLibrary, RETREAT_CATEGORIES } from "./galleryUtils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  events: any[];
  library?: "gallery" | "retreats";
  defaultCategory?: (typeof RETREAT_CATEGORIES)[number]["id"];
  onAlbumCreated: (album: any) => void;
}

export default function AlbumCreateDialog({ open, onOpenChange, events, library = "gallery", defaultCategory = "workshops", onAlbumCreated }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [destination, setDestination] = useState<"gallery" | "retreats">(library);
  const [category, setCategory] = useState<(typeof RETREAT_CATEGORIES)[number]["id"]>("workshops");
  const [template, setTemplate] = useState<"scroll" | "grid">("grid");
  const anchorEventId = events.find((event) => /retreat/i.test(event.title || ""))?.id || events[0]?.id || "";
  const isWorkshop = destination === "retreats";

  useEffect(() => {
    if (open) {
      setDestination(library);
      setCategory(defaultCategory);
    }
  }, [open, library, defaultCategory]);

  const createAlbum = useMutation({
    mutationFn: async () => {
      const linkedEventId = isWorkshop ? anchorEventId : eventId;
      if (!user || !title || !linkedEventId) throw new Error(isWorkshop ? "Add a calendar event first, then create the workshop" : "Fill all fields");
      const { data, error } = await supabase.from("albums").insert({
        title: albumTitleForLibrary(title, destination, category),
        event_id: linkedEventId,
        uploader_id: user.id,
        template,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["my-albums"] });
      queryClient.invalidateQueries({ queryKey: ["event_media"] });
      toast.success(isWorkshop ? `Event "${title}" added` : `Album "${title}" created`);
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
            <Image className="h-4 w-4" /> {isWorkshop ? "Add Event" : "Create Album"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {library !== "retreats" && (
            <div className="space-y-1">
              <Label className="text-xs">Save in</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDestination("gallery")} className={cn("rounded-lg border px-3 py-2 text-xs font-medium", destination === "gallery" ? "border-primary bg-primary/5 text-primary" : "border-border")}>My Album</button>
                <button type="button" onClick={() => setDestination("retreats")} className={cn("rounded-lg border px-3 py-2 text-xs font-medium", destination === "retreats" ? "border-primary bg-primary/5 text-primary" : "border-border")}>Office Retreat</button>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">{isWorkshop ? "Event title" : "Album Title"}</Label>
            <Input className="h-8 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isWorkshop ? "e.g. Leadership session" : "e.g. Orange Fest 2026"} />
          </div>
          {isWorkshop ? (
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {RETREAT_CATEGORIES.map((item) => (
                  <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={cn("rounded-lg border px-2 py-2 text-xs font-medium", category === item.id ? "border-primary bg-primary/5 text-primary" : "border-border")}>{item.label}</button>
                ))}
              </div>
            </div>
          ) : (
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
          )}
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
            disabled={!title || (isWorkshop ? !anchorEventId : !eventId) || createAlbum.isPending}
          >
            {createAlbum.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            {isWorkshop ? "Add Event" : "Create Album"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

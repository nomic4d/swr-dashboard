import { useEffect, useRef } from "react";
import Plyr from "plyr";

const PlyrVideo = ({ src, poster }: { src: string; poster?: string | null }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const instanceRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!instanceRef.current) {
      instanceRef.current = new Plyr(ref.current, {
        controls: ["play-large", "play", "progress", "current-time", "duration", "mute", "volume", "fullscreen"],
      });
    }
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  return <video ref={ref} src={src} poster={poster || undefined} controls playsInline className="max-h-[85vh] max-w-full" />;
};

export default PlyrVideo;

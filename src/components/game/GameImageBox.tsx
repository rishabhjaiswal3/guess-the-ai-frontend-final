import { useState, useEffect, type SyntheticEvent } from "react";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import { cn } from "@/lib/utils";

type SkeletonAspect = "square" | "portrait" | "landscape";

interface GameImageBoxProps {
  src: string | undefined | null;
  alt: string;
  /** Kept visible under the image until decode + paint */
  skeletonAspect?: SkeletonAspect;
  className?: string;
  imgClassName?: string;
  onLoad?: () => void;
  onImageError?: (e: SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Fills a relative, overflow-hidden card: muted frame + skeleton until the image loads,
 * so tiles never flash empty between round/API and network paint.
 */
const GameImageBox = ({
  src,
  alt,
  skeletonAspect = "square",
  className,
  imgClassName,
  onLoad,
  onImageError,
}: GameImageBoxProps) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-muted/95 via-muted/50 to-muted/80 ring-1 ring-inset ring-border/45"
        aria-hidden
      />

      {src ? (
        <>
          {!loaded && (
            <ImageSkeleton
              className="pointer-events-none absolute inset-0 z-[1] rounded-none"
              aspectRatio={skeletonAspect}
            />
          )}
          <img
            src={src}
            alt={alt}
            decoding="async"
            draggable={false}
            className={cn(
              "pointer-events-auto absolute inset-0 z-[2] h-full w-full object-cover object-center transition-opacity duration-200",
              loaded ? "opacity-100" : "opacity-0",
              imgClassName,
            )}
            onLoad={() => {
              setLoaded(true);
              onLoad?.();
            }}
            onError={onImageError}
          />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-muted/55 ring-1 ring-inset ring-border/35">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            —
          </span>
        </div>
      )}
    </div>
  );
};

export default GameImageBox;

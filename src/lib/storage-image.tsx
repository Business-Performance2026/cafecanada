import { useState } from "react";
import { Coffee } from "lucide-react";
import { useUpload } from "@/lib/upload";

/** Simple <img> that shows a placeholder while a remote image loads. */
export function CafeImage({
  url,
  alt,
  className,
  fallback,
}: {
  url?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  if (!url) return <>{fallback ?? null}</>;
  return (
    <>
      {!loaded && <div className={(className ?? "") + " animate-pulse bg-muted"} aria-hidden />}
      <img
        src={url}
        alt={alt}
        className={className + (loaded ? "" : " hidden")}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

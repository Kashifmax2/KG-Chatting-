/**
 * ImageCropper — dependency-free crop/zoom for avatars and banners.
 *
 * The user picks a file, then pans (drag) and zooms (slider / wheel) inside a
 * fixed viewport. On confirm we render the visible region to a canvas at a
 * target output size and hand back a JPEG/PNG `File`, ready for upload. No
 * third-party cropping library — just canvas + pointer events.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCropperProps {
  /** Source image object URL. */
  src: string;
  /** "avatar" → circular 1:1; "banner" → wide rectangle. */
  shape: "avatar" | "banner";
  /** Output pixel width (height derives from aspect). */
  outputWidth: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  /** Preserve the original filename stem on output. */
  fileName: string;
}

const ASPECT: Record<ImageCropperProps["shape"], number> = {
  avatar: 1,
  banner: 16 / 9,
};

export function ImageCropper({
  src,
  shape,
  outputWidth,
  onCancel,
  onConfirm,
  fileName,
}: ImageCropperProps) {
  const aspect = ASPECT[shape];
  const viewportW = 320;
  const viewportH = Math.round(viewportW / aspect);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // Load the source image to learn its natural size and set a baseline zoom
  // that covers the viewport ("cover" behaviour).
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  // Base scale so the image always covers the viewport at zoom = 1.
  const baseScale =
    natural.w && natural.h
      ? Math.max(viewportW / natural.w, viewportH / natural.h)
      : 1;
  const scale = baseScale * zoom;
  const drawW = natural.w * scale;
  const drawH = natural.h * scale;

  // Keep the image covering the viewport — clamp the pan offset.
  const clamp = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(0, (drawW - viewportW) / 2);
      const maxY = Math.max(0, (drawH - viewportH) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [drawW, drawH, viewportW, viewportH]
  );

  useEffect(() => {
    setOffset((o) => clamp(o.x, o.y));
  }, [clamp]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => clamp(o.x + dx, o.y + dy));
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;
    const outW = outputWidth;
    const outH = Math.round(outputWidth / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map the viewport region back to source pixels. Top-left of the drawn
    // image relative to the viewport centre, then the source rect (in natural
    // pixels) currently framed by the viewport.
    const imgLeft = viewportW / 2 + offset.x - drawW / 2;
    const imgTop = viewportH / 2 + offset.y - drawH / 2;
    const sx = -imgLeft / scale;
    const sy = -imgTop / scale;
    const sWidth = viewportW / scale;
    const sHeight = viewportH / scale;

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outW, outH);

    const isPng = fileName.toLowerCase().endsWith(".png");
    const mime = isPng ? "image/png" : "image/jpeg";
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const stem = fileName.replace(/\.[^.]+$/, "") || "image";
        const ext = isPng ? "png" : "jpg";
        onConfirm(new File([blob], `${stem}.${ext}`, { type: mime }));
      },
      mime,
      0.92
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative touch-none overflow-hidden bg-black/40"
        style={{
          width: viewportW,
          height: viewportH,
          borderRadius: shape === "avatar" ? "9999px" : "0.75rem",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {loaded && (
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute select-none"
            style={{
              width: drawW,
              height: drawH,
              left: viewportW / 2 + offset.x - drawW / 2,
              top: viewportH / 2 + offset.y - drawH / 2,
              maxWidth: "none",
            }}
          />
        )}
      </div>

      <div className="flex w-full items-center gap-3">
        <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="range"
          aria-label="Zoom"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-elevated accent-brand"
        />
        <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="flex w-full justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={!loaded}>
          Apply
        </Button>
      </div>
    </div>
  );
}

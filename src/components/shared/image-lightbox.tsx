import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

/** Fullscreen image viewer opened when a message image is clicked. */
export function ImageLightbox() {
  const preview = useUIStore((s) => s.imagePreview);
  const setPreview = useUIStore((s) => s.setImagePreview);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPreview]);

  return (
    <AnimatePresence>
      {preview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/85 p-8"
        >
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            src={preview.url}
            alt={preview.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
          <div className="mt-4 flex items-center gap-3">
            <a
              href={preview.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-white/80 underline-offset-4 hover:underline"
            >
              Open original
            </a>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                window.open(preview.url, "_blank");
              }}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setPreview(null)}
            className="absolute right-6 top-6 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

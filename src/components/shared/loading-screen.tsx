import { motion } from "framer-motion";

/** Full-viewport branded loader used as the Suspense fallback for routes. */
export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-background">
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-brand/40"
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-fuchsia-500 text-2xl font-black text-white shadow-xl"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          KG
        </motion.div>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {label}
        <motion.span
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          ...
        </motion.span>
      </div>
    </div>
  );
}

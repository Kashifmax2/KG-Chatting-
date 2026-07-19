import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-8xl font-black text-brand"
      >
        404
      </motion.div>
      <div>
        <h1 className="text-2xl font-bold">Wumpus can't find this page</h1>
        <p className="mt-1 text-muted-foreground">
          The link may be broken, or the page may have been moved.
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/friends">Take me home</Link>
      </Button>
    </div>
  );
}

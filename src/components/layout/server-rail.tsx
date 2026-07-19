import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Download, Plus } from "lucide-react";
import { servers } from "@/data/servers";
import { useUIStore } from "@/stores/ui-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** A single pill indicator that grows on hover/active, Discord-style. */
function Pill({ active, hovered }: { active: boolean; hovered: boolean }) {
  return (
    <div className="absolute left-0 flex h-full w-1 items-center">
      <motion.div
        className="w-full rounded-r-full bg-foreground"
        initial={false}
        animate={{
          height: active ? 40 : hovered ? 20 : 8,
          opacity: active || hovered ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );
}

interface RailIconProps {
  to: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  end?: boolean;
}

function RailIcon({
  to,
  label,
  children,
  className,
  activeClassName,
  end,
}: RailIconProps) {
  return (
    <NavLink to={to} end={end} className="group relative flex justify-center">
      {({ isActive }) => (
        <>
          <Pill active={isActive} hovered={false} />
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center overflow-hidden bg-elevated text-foreground transition-all duration-200",
                  isActive
                    ? cn("rounded-2xl", activeClassName)
                    : cn("rounded-3xl group-hover:rounded-2xl", className),
                )}
              >
                {children}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </>
      )}
    </NavLink>
  );
}

export function ServerRail() {
  const openModal = useUIStore((s) => s.openModal);
  const navigate = useNavigate();
  const location = useLocation();

  const homeActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/friends") ||
    location.pathname.startsWith("/dm") ||
    location.pathname.startsWith("/notifications");

  return (
    <nav className="flex h-full w-[72px] flex-col items-center gap-2 bg-rail py-3">
      {/* Home / DMs */}
      <RailIcon
        to="/"
        label="Direct Messages"
        end
        className={cn(
          "group-hover:bg-brand group-hover:text-white",
          homeActive && "bg-brand text-white"
        )}
        activeClassName="bg-brand text-white"
      >
        <span className="text-lg font-black">KG</span>
      </RailIcon>

      <div className="my-1 h-0.5 w-8 rounded-full bg-border" />

      {/* Server list */}
      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto scrollbar-none">
        {servers.map((server) => (
          <RailIcon
            key={server.id}
            to={`/servers/${server.id}`}
            label={server.name}
            className="group-hover:bg-brand group-hover:text-white"
            activeClassName="bg-brand text-white"
          >
            {server.iconUrl ? (
              <img
                src={server.iconUrl}
                alt={server.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-base font-bold">
                {server.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
            )}
          </RailIcon>
        ))}

        {/* Add a server */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => openModal("createServer")}
              className="flex h-12 w-12 items-center justify-center rounded-3xl bg-elevated text-online transition-all duration-200 hover:rounded-2xl hover:bg-online hover:text-white"
            >
              <Plus className="h-6 w-6" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">Add a Server</TooltipContent>
        </Tooltip>

        {/* Explore */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate("/explore")}
              className="flex h-12 w-12 items-center justify-center rounded-3xl bg-elevated text-online transition-all duration-200 hover:rounded-2xl hover:bg-online hover:text-white"
            >
              <Compass className="h-6 w-6" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">Explore Servers</TooltipContent>
        </Tooltip>
      </div>

      {/* Download / footer icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex h-12 w-12 items-center justify-center rounded-3xl bg-elevated text-muted-foreground transition-all duration-200 hover:rounded-2xl hover:bg-brand hover:text-white">
            <Download className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Get the Desktop App</TooltipContent>
      </Tooltip>
    </nav>
  );
}

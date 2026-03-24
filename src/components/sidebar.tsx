"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BookOpen, Home, Moon, Sun, UserCircle, Users } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/character", label: "Characters", icon: Users },
  { href: "/story", label: "Stories", icon: BookOpen },
  { href: "/persona", label: "Personas", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Needed for SSR & theme selector
    setMounted(true);
  }, []);

  return (
    <aside className="flex h-full w-12 flex-col border-r bg-sidebar p-2 gap-1 items-center">
      {links.map(({ href, label, icon: Icon }) => (
        <Tooltip key={href}>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                "flex items-center justify-center rounded-md p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === href || (href !== "/" && pathname.startsWith(href))
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
      {mounted && (
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle theme</TooltipContent>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}

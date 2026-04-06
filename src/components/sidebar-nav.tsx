"use client";

import {
  BookOpen,
  Globe,
  Home,
  Library,
  MessageSquareCode,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/character", icon: Users, label: "Characters" },
  { href: "/persona", icon: UserCircle, label: "Personas" },
  { href: "/world", icon: Globe, label: "world" },
  { href: "/story", icon: BookOpen, label: "Stories" },
  { href: "/lorebook", icon: Library, label: "Lorebooks" },
  { href: "/prompt", icon: MessageSquareCode, label: "Prompts" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, icon: Icon, label }) => (
        <Tooltip key={href}>
          <TooltipTrigger asChild>
            <Link
              className={cn(
                "flex items-center justify-center rounded-md p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === href || (href !== "/" && pathname.startsWith(href))
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground",
              )}
              href={href}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
    </>
  );
}

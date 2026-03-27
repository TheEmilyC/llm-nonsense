"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Home, MessageSquareCode, UserCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/character", label: "Characters", icon: Users },
  { href: "/story", label: "Stories", icon: BookOpen },
  { href: "/persona", label: "Personas", icon: UserCircle },
  { href: "/prompt", label: "Prompts", icon: MessageSquareCode },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
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
    </>
  );
}

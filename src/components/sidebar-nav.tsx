"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CharacterIcon,
  HomeIcon,
  LorebookIcon,
  PersonaIcon,
  PromptIcon,
  StoryIcon,
  WorldIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/character", icon: CharacterIcon, label: "Characters" },
  { href: "/persona", icon: PersonaIcon, label: "Personas" },
  { href: "/world", icon: WorldIcon, label: "world" },
  { href: "/story", icon: StoryIcon, label: "Stories" },
  { href: "/lorebook", icon: LorebookIcon, label: "Lorebooks" },
  { href: "/prompt", icon: PromptIcon, label: "Prompts" },
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

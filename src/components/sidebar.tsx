import { Suspense } from "react";

import { NavLinks } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar() {
  return (
    <aside className="flex h-full w-12 flex-col border-r bg-sidebar p-2 gap-1 items-center">
      <Suspense>
        <NavLinks />
      </Suspense>
      <div className="mt-auto">
        <Suspense>
          <ThemeToggle />
        </Suspense>
      </div>
    </aside>
  );
}

"use client";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  pageTitle?: string;
  backLinkLabel?: string;
  backLinkDestination?: string;
  children?: React.ReactNode;
}

export function Header({
  pageTitle,
  backLinkLabel,
  backLinkDestination,
  children,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {backLinkDestination && (
          <Button variant={"outline"} asChild>
            <Link href={backLinkDestination}>← {backLinkLabel}</Link>
          </Button>
        )}

        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>
      <div className="flex gap-2">{children}</div>
    </header>
  );
}

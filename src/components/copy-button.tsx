"use client";

import { useState } from "react";

import { ConfirmIcon, CopyIcon } from "@/lib/icons";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const Icon = copied ? ConfirmIcon : CopyIcon;

  return (
    <button
      aria-label="Copy to clipboard"
      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      onClick={handleCopy}
      type="button"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

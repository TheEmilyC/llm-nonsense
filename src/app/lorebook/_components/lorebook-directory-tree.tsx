"use client";

import { useCallback } from "react";

import { getLorebookDirectoryAction } from "@/app/lorebook/_lib/actions";
import { TreeView, type TreeViewNode } from "@/components/ui/tree-view";

interface LorebookDirectoryTreeProps {
  className?: string;
  height?: number | string;
  lorebookId: string;
  onFileSelect?: (path: string) => void;
}

export function LorebookDirectoryTree({
  className,
  height,
  lorebookId,
  onFileSelect,
}: LorebookDirectoryTreeProps) {
  const getItem = useCallback(
    (id: string): Promise<TreeViewNode> =>
      Promise.resolve(nodeFromPath(id)),
    [],
  );

  const getChildren = useCallback(
    async (id: string): Promise<string[]> => {
      // Root item id is "__root__" — treat it as vault root (empty path)
      const path = id === "__root__" ? "" : id;
      const result = await getLorebookDirectoryAction(lorebookId, path);
      return result.success ? (result.data ?? []) : [];
    },
    [lorebookId],
  );

  return (
    <TreeView
      className={className}
      getChildren={getChildren}
      getItem={getItem}
      height={height}
      onSelect={onFileSelect}
    />
  );
}

/**
 * Derives display label and folder status from a vault path ID.
 * Files are identified by having a file extension; folders have none.
 * The root sentinel "__root__" maps to a virtual "Vault" folder.
 */
function nodeFromPath(id: string): TreeViewNode {
  if (id === "__root__") return { isFolder: true, label: "Vault" };
  const segments = id.split("/").filter(Boolean);
  const label = segments[segments.length - 1] ?? id;
  // Obsidian notes are always .md; lack of an extension means it's a folder
  const isFolder = !label.includes(".");
  return { isFolder, label };
}

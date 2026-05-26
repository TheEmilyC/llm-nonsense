"use client";

import { useCallback } from "react";

import { getLorebookDirectoryAction } from "@/app/lorebook/_lib/actions";
import {
  TreeView,
  type TreeViewContextMenuItem,
  type TreeViewNode,
} from "@/components/ui/tree-view";
import { MemoryIcon } from "@/lib/icons";

interface LorebookDirectoryTreeProps {
  className?: string;
  height?: number | string;
  lorebookId: string;
  memoryLocation?: null | string;
  onMemoryLocationChange?: (path: null | string) => void;
}

export function LorebookDirectoryTree({
  className,
  height,
  lorebookId,
  memoryLocation,
  onMemoryLocationChange,
}: LorebookDirectoryTreeProps) {
  const getItem = useCallback(
    (id: string): Promise<TreeViewNode> => Promise.resolve(nodeFromPath(id)),
    [],
  );

  const getChildren = useCallback(
    async (id: string): Promise<string[]> => {
      const path = id === "__root__" ? "" : id;
      const result = await getLorebookDirectoryAction(lorebookId, path);
      return result.success ? (result.data ?? []) : [];
    },
    [lorebookId],
  );

  const directoryItems = useCallback(
    (id: string): TreeViewContextMenuItem[] => {
      if (id === memoryLocation) {
        return [
          {
            icon: <MemoryIcon />,
            label: "Remove memory location",
            onSelect: () => onMemoryLocationChange?.(null),
          },
        ];
      }
      return [
        {
          icon: <MemoryIcon />,
          label: "Set as memory location",
          onSelect: () => onMemoryLocationChange?.(id),
        },
      ];
    },
    [memoryLocation, onMemoryLocationChange],
  );

  const renderItemSuffix = useCallback(
    (id: string, node: TreeViewNode) => {
      if (node.isFolder && id === memoryLocation) {
        return (
          <MemoryIcon className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        );
      }
      return null;
    },
    [memoryLocation],
  );

  return (
    <TreeView
      className={className}
      contextMenu={{ directoryItems }}
      getChildren={getChildren}
      getItem={getItem}
      height={height}
      renderItemSuffix={renderItemSuffix}
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

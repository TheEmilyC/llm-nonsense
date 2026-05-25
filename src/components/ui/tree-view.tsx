"use client";

import { useRef } from "react";
import {
  asyncDataLoaderFeature,
  hotkeysCoreFeature,
  type ItemInstance,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, File, Folder, FolderOpen, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TreeViewNode {
  isFolder: boolean;
  label: string;
}

export interface TreeViewProps {
  className?: string;
  getChildren: (id: string) => Promise<string[]>;
  getItem: (id: string) => Promise<TreeViewNode>;
  height?: number | string;
  onSelect?: (id: string) => void;
  rootId?: string;
}

const ITEM_HEIGHT = 32;

export function TreeView({
  className,
  getChildren,
  getItem,
  height = 400,
  onSelect,
  rootId = "__root__",
}: TreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const tree = useTree<TreeViewNode>({
    dataLoader: { getChildren, getItem },
    features: [asyncDataLoaderFeature, hotkeysCoreFeature],
    getItemName: (item) => item.getItemData()?.label ?? item.getId(),
    isItemFolder: (item) => item.getItemData()?.isFolder ?? false,
    onPrimaryAction: (item) => {
      if (item.isFolder()) {
        item.isExpanded() ? item.collapse() : item.expand();
      } else {
        onSelect?.(item.getId());
      }
    },
    rootItemId: rootId,
  });

  const items = tree.getItems();

  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize: () => ITEM_HEIGHT,
    getScrollElement: () => containerRef.current,
    overscan: 10,
  });

  return (
    <div
      {...tree.getContainerProps("File tree")}
      ref={(el) => {
        containerRef.current = el;
        tree.registerElement(el);
      }}
      className={cn("overflow-y-auto outline-none", className)}
      style={{ height }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;
          return (
            <TreeViewItem
              item={item}
              key={item.getKey()}
              onSelect={onSelect}
              style={{
                height: ITEM_HEIGHT,
                left: 0,
                position: "absolute",
                right: 0,
                top: 0,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

interface TreeViewItemProps {
  item: ItemInstance<TreeViewNode>;
  onSelect?: (id: string) => void;
  style: React.CSSProperties;
}

function TreeViewItem({ item, style }: TreeViewItemProps) {
  const data = item.getItemData();
  const { level } = item.getItemMeta();
  const isFolder = item.isFolder();
  const isExpanded = isFolder && item.isExpanded();
  const isLoading = item.isLoading();
  const isFocused = item.isFocused();

  return (
    <div style={style}>
      <div
        {...item.getProps()}
        className={cn(
          "flex h-full cursor-pointer select-none items-center gap-1.5 rounded-sm text-sm",
          "outline-none transition-colors hover:bg-muted/50",
          isFocused && "bg-muted",
        )}
        style={{ paddingLeft: `${(level - 1) * 16 + 8}px`, paddingRight: 8 }}
        onClick={() => {
          if (isFolder) {
            isExpanded ? item.collapse() : item.expand();
          } else {
            item.primaryAction();
          }
        }}
      >
        {isFolder ? (
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-muted-foreground/70 transition-transform duration-150",
              isExpanded && "rotate-90",
            )}
          />
        ) : (
          <span aria-hidden className="w-3 shrink-0" />
        )}
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : isFolder ? (
          isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{data?.label ?? item.getId()}</span>
      </div>
    </div>
  );
}

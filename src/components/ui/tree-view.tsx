"use client";

import {
  asyncDataLoaderFeature,
  hotkeysCoreFeature,
  type ItemInstance,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, File, Folder, FolderOpen, Loader2 } from "lucide-react";
import { useRef } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

export interface TreeViewContextMenu {
  /** Items shown when right-clicking a directory node.
   *  Pass a function to compute items dynamically per node ID. */
  directoryItems?:
    | ((id: string) => TreeViewContextMenuItem[])
    | TreeViewContextMenuItem[];
  /** Items shown when right-clicking a file node.
   *  Pass a function to compute items dynamically per node ID. */
  fileItems?:
    | ((id: string) => TreeViewContextMenuItem[])
    | TreeViewContextMenuItem[];
}

export type TreeViewContextMenuItem =
  | {
      icon?: React.ReactNode;
      label: string;
      onSelect: (id: string) => void;
      type?: "item";
      variant?: "default" | "destructive";
    }
  | { type: "separator" };

export interface TreeViewNode {
  isFolder: boolean;
  label: string;
}

export interface TreeViewProps {
  className?: string;
  contextMenu?: TreeViewContextMenu;
  getChildren: (id: string) => Promise<string[]>;
  getItem: (id: string) => Promise<TreeViewNode>;
  height?: number | string;
  onSelect?: (id: string) => void;
  /** Rendered after the label inside each item row. Use for badges or status icons. */
  renderItemSuffix?: (id: string, node: TreeViewNode) => React.ReactNode;
  rootId?: string;
}

const ITEM_HEIGHT = 32;

interface TreeViewItemProps {
  contextMenu?: TreeViewContextMenu;
  item: ItemInstance<TreeViewNode>;
  onSelect?: (id: string) => void;
  renderItemSuffix?: TreeViewProps["renderItemSuffix"];
  style: React.CSSProperties;
}

export function TreeView({
  className,
  contextMenu,
  getChildren,
  getItem,
  height = 400,
  onSelect,
  renderItemSuffix,
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
      className={cn("overflow-y-auto outline-none", className)}
      ref={(el) => {
        containerRef.current = el;
        tree.registerElement(el);
      }}
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
              contextMenu={contextMenu}
              item={item}
              key={item.getKey()}
              onSelect={onSelect}
              renderItemSuffix={renderItemSuffix}
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

function resolveMenuItems(
  items:
    | ((id: string) => TreeViewContextMenuItem[])
    | TreeViewContextMenuItem[]
    | undefined,
  id: string,
): TreeViewContextMenuItem[] {
  if (!items) return [];
  return typeof items === "function" ? items(id) : items;
}

function TreeViewItem({
  contextMenu,
  item,
  renderItemSuffix,
  style,
}: TreeViewItemProps) {
  const data = item.getItemData();
  const { level } = item.getItemMeta();
  const isFolder = item.isFolder();
  const isExpanded = isFolder && item.isExpanded();
  const isLoading = item.isLoading();
  const isFocused = item.isFocused();

  const id = item.getId();
  const menuItems = resolveMenuItems(
    isFolder ? contextMenu?.directoryItems : contextMenu?.fileItems,
    id,
  );

  return (
    <div style={style}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            {...item.getProps()}
            className={cn(
              "flex h-full cursor-pointer select-none items-center gap-1.5 rounded-sm text-sm",
              "outline-none transition-colors hover:bg-muted/50",
              isFocused && "bg-muted",
            )}
            onClick={() => {
              if (isFolder) {
                isExpanded ? item.collapse() : item.expand();
              } else {
                item.primaryAction();
              }
            }}
            style={{
              paddingLeft: `${(level - 1) * 16 + 8}px`,
              paddingRight: 8,
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
            <span className="min-w-0 flex-1 truncate">{data?.label ?? id}</span>
            {data && renderItemSuffix?.(id, data)}
          </div>
        </ContextMenuTrigger>
        {menuItems.length > 0 && (
          <ContextMenuContent>
            {menuItems.map((menuItem, i) => {
              if (menuItem.type === "separator") {
                return <ContextMenuSeparator key={i} />;
              }
              return (
                <ContextMenuItem
                  key={i}
                  onSelect={() => menuItem.onSelect(item.getId())}
                  variant={menuItem.variant}
                >
                  {menuItem.icon}
                  {menuItem.label}
                </ContextMenuItem>
              );
            })}
          </ContextMenuContent>
        )}
      </ContextMenu>
    </div>
  );
}

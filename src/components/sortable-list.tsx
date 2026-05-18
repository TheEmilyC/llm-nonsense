"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useRef } from "react";

import { DragIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  children: React.ReactNode;
  id: string;
  index: number;
  onClick: () => void;
}

interface SortableListProps<T> {
  getItemId: (item: T, index: number) => string;
  items: T[];
  onItemClick: (item: T) => void;
  onOrderChange: (items: T[]) => void;
  // renderItem instead of children: move() needs the raw items array to reorder on drag end
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function SortableList<T>({
  getItemId,
  items,
  onItemClick,
  onOrderChange,
  renderItem,
}: SortableListProps<T>) {
  const scrollYRef = useRef(0);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        window.scrollTo({ top: scrollYRef.current });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- move requires an id property but uses references to move items
        const newItems = move(items as any, event) as T[];
        onOrderChange(newItems);
      }}
      onDragStart={() => {
        scrollYRef.current = window.scrollY;
      }}
    >
      <div className="flex flex-col gap-1">
        {items.map((item, index) => {
          const id = getItemId(item, index);
          return (
            <SortableItem
              id={id}
              index={index}
              key={id}
              onClick={() => onItemClick(item)}
            >
              {renderItem(item, index)}
            </SortableItem>
          );
        })}
      </div>
    </DragDropProvider>
  );
}

function SortableItem({ children, id, index, onClick }: SortableItemProps) {
  const { handleRef, isDragSource, ref } = useSortable({ id, index });

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card px-3 py-2 transition-opacity",
        isDragSource && "opacity-40",
      )}
      ref={ref}
    >
      <button
        aria-label="Drag to reorder"
        className="shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        ref={handleRef}
        type="button"
      >
        <DragIcon className="h-4 w-4" />
      </button>
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}

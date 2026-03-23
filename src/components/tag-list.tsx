"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagListProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  options?: string[];
  placeholder?: string;
  className?: string;
}

export function TagList({
  value = [],
  onChange,
  options = [],
  placeholder = "Add tag…",
  className,
}: TagListProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      o.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(o),
  );

  const showDropdown =
    open && (filtered.length > 0 || inputValue.trim().length > 0);
  const canAddCustom =
    inputValue.trim().length > 0 &&
    !options.includes(inputValue.trim()) &&
    !value.includes(inputValue.trim());

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue("");
    setActiveIndex(-1);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        addTag(filtered[activeIndex]);
      } else if (canAddCustom) {
        addTag(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) =>
        Math.min(i + 1, filtered.length + (canAddCustom ? 0 : -1)),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className="flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="h-6 gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="rounded-sm opacity-60 hover:opacity-100 focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-20 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <ul className="max-h-52 overflow-auto p-1 text-sm">
            {filtered.map((option, i) => (
              <li
                key={option}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(option);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5",
                  activeIndex === i
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {option}
              </li>
            ))}
            {canAddCustom && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(inputValue);
                }}
                onMouseEnter={() => setActiveIndex(filtered.length)}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-1.5 rounded-sm px-2 py-1.5 text-muted-foreground",
                  activeIndex === filtered.length
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <span className="text-xs font-medium">Add</span>
                <Badge variant="outline" className="h-5">
                  {inputValue.trim()}
                </Badge>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

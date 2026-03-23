"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { CardTile } from "@/components/card-tile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface CardOption {
  id: string;
  name: string;
  imageUrl: string;
}

interface CardSelectorParams {
  icon?: LucideIcon;
  label?: string;
  options?: CardOption[];
  selectedId?: string;
  onChange?: (selected: CardOption) => void;
}

export function CardSelector({
  icon: Icon,
  label,
  options,
  selectedId,
  onChange,
}: CardSelectorParams) {
  const [open, setOpen] = useState(false);
  const selected = options?.find((o) => o.id === selectedId);
  function handleSelectChange(selected: CardOption) {
    setOpen(false);
    onChange?.(selected);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full h-full">
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed cursor-pointer hover:border-foreground/40 transition-colors">
          {selected ? (
            <CardTile name={selected.name} src={selected.imageUrl} />
          ) : (
            <div className="flex flex-col items-center gap-1">
              {Icon && <Icon className="text-muted-foreground" />}
              <span className="text-xs text-center px-2">{label}</span>
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none sm:max-w-none flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{label} Select</DialogTitle>
          <DialogDescription className="sr-only">
            Select a {label}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {options && options.length > 0 ? (
            options?.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelectChange(opt)}
                className={cn(
                  opt.id === selectedId && "ring-2 ring-primary rounded-lg",
                )}
              >
                <CardTile name={opt.name} src={opt.imageUrl} />
              </div>
            ))
          ) : (
            <span>No items</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

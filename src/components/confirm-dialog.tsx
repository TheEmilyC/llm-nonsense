import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ConfirmDialogParams {
  children: ReactNode;
  description: string;
  onConfirm?: () => void;
  title: string;
  type?: ConfirmDialogType;
}

export type ConfirmDialogType = "delete" | "ok";

export function ConfirmDialog({
  children,
  description,
  onConfirm,
  title,
  type = "ok",
}: ConfirmDialogParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            {type === "ok" && (
              <Button onClick={onConfirm} size="sm">
                Ok
              </Button>
            )}
            {type === "delete" && (
              <Button onClick={onConfirm} size="sm" variant="destructive">
                Delete
              </Button>
            )}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

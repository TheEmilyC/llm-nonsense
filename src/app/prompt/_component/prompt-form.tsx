"use client";

import type { LucideIcon } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  UseFormSetError,
  useWatch,
} from "react-hook-form";

import { promptFormSchema, PromptFormValues } from "@/app/prompt/_lib/schema";
import { FieldInput } from "@/components/form-fields/field-input";
import { SortableList } from "@/components/sortable-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AssistantIcon,
  DeleteIcon,
  HistoryIcon,
  LockedIcon,
  SystemIcon,
  UserIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { label: "System", value: "system" },
  { label: "User", value: "user" },
  { label: "Assistant", value: "assistant" },
];

const ROLE_ICONS: Record<string, LucideIcon> = {
  ["assistant"]: AssistantIcon,
  ["history"]: HistoryIcon,
  ["system"]: SystemIcon,
  ["user"]: UserIcon,
};

interface PromptFormProps {
  defaultValues?: PromptFormValues;
  formId: string;
  onSubmit: (
    data: PromptFormValues,
    setError: UseFormSetError<PromptFormValues>,
  ) => void;
}

export function PromptForm({
  defaultValues,
  formId,
  onSubmit,
}: PromptFormProps) {
  const [editingIndex, setEditingIndex] = useState<null | number>(null);

  const form = useForm<PromptFormValues>({
    defaultValues: defaultValues || {
      maxOutputTokens: 0,
      maxSteps: 20,
      maxTokens: 80000,
      name: "",
      promptFragments: [],
      temperature: 0.9,
      topK: 64,
      topP: 0.95,
    },
    mode: "onTouched",
    resolver: zodResolver(promptFormSchema),
  });

  const watchedFragments = useWatch({
    control: form.control,
    name: "promptFragments",
  });

  const { append, fields, move, remove } = useFieldArray({
    control: form.control,
    keyName: "_rhfId",
    name: "promptFragments",
  });

  function handleOrderChange(newFields: typeof fields) {
    for (let newIndex = 0; newIndex < newFields.length; newIndex++) {
      const oldIndex = fields.findIndex(
        (f) => f._rhfId === newFields[newIndex]._rhfId,
      );
      if (oldIndex !== newIndex) {
        move(oldIndex, newIndex);
        return;
      }
    }
  }

  const editingFragment = editingIndex !== null ? fields[editingIndex] : null;

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit((data) => onSubmit(data, form.setError))}
    >
      <FieldGroup>
        <FieldInput control={form.control} label="Name" name="name" />
        <FieldInput
          control={form.control}
          label="Max Context Tokens"
          name="maxTokens"
          type="number"
        />
        <FieldInput
          control={form.control}
          label="Max Output Tokens (0 = Unlimited)"
          name="maxOutputTokens"
          type="number"
        />
        <FieldInput
          control={form.control}
          label="Max Steps"
          name="maxSteps"
          type="number"
        />
        <FieldInput
          control={form.control}
          label="Temperature"
          name="temperature"
          type="number"
        />
        <FieldInput
          control={form.control}
          label="Top K"
          name="topK"
          type="number"
        />
        <FieldInput
          control={form.control}
          label="Top P"
          name="topP"
          type="number"
        />
      </FieldGroup>
      <FieldSet className="mt-6">
        <div className="flex items-center justify-between">
          <FieldLegend variant="label">Fragments</FieldLegend>
          <Button
            onClick={() =>
              append({
                content: "",
                enabled: true,
                name: "New Fragment",
                role: "system",
                type: "CONTENT",
              })
            }
            size="sm"
            variant="ghost"
          >
            + Add
          </Button>
        </div>
        <SortableList
          getItemId={(field) => field._rhfId}
          items={fields}
          onItemClick={(field) =>
            setEditingIndex(fields.findIndex((f) => f._rhfId === field._rhfId))
          }
          onOrderChange={handleOrderChange}
          renderItem={(field) => {
            const index = fields.findIndex((f) => f._rhfId === field._rhfId);
            const watched = watchedFragments[index];
            const Icon =
              watched?.type === "CHAT_HISTORY"
                ? ROLE_ICONS["history"]
                : ROLE_ICONS[watched?.role ?? "system"];
            return (
              <div
                className={cn(
                  " flex items-center justify-between gap-2",
                  !watched?.enabled && "opacity-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <Controller
                    control={form.control}
                    name={`promptFragments.${index}.enabled`}
                    render={({ field: f }) => (
                      <Switch
                        checked={f.value}
                        onCheckedChange={f.onChange}
                        onClick={(e) => e.stopPropagation()}
                        size="sm"
                      />
                    )}
                  />
                  <span className="text-sm font-medium">{watched?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {field.type === "CONTENT" && "content"}
                    {field.type === "INJECT" && field.injectTag}
                    {field.type === "CHAT_HISTORY" && "chatHistory"}
                  </span>
                  {field.type === "CONTENT" ? (
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(index);
                      }}
                      size="icon-sm"
                      type="button"
                      variant="destructive"
                    >
                      <DeleteIcon className="text-muted-foreground" />
                    </Button>
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center">
                      <LockedIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </FieldSet>

      <Dialog
        onOpenChange={(open) => !open && setEditingIndex(null)}
        open={editingIndex !== null}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fragment</DialogTitle>
          </DialogHeader>
          {editingIndex !== null && (
            <FieldGroup>
              <Controller
                control={form.control}
                name={`promptFragments.${editingIndex}.name`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Name</FieldLabel>
                    <Input {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {editingFragment?.type !== "CHAT_HISTORY" && (
                <Controller
                  control={form.control}
                  name={`promptFragments.${editingIndex}.role`}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Role</FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {ROLE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              )}

              {editingFragment?.type === "CONTENT" && (
                <Controller
                  control={form.control}
                  name={`promptFragments.${editingIndex}.content`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Content</FieldLabel>
                      <Textarea {...field} rows={6} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
            </FieldGroup>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </form>
  );
}

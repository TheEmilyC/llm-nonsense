"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Cpu, Lock, Trash2, User } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

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
import { cn } from "@/lib/utils";

import { MessageRole } from "../../../../generated/enums";

const ROLE_OPTIONS = [
  { label: "System", value: MessageRole.system },
  { label: "User", value: MessageRole.user },
  { label: "Assistant", value: MessageRole.assistant },
];

const ROLE_ICONS: Record<MessageRole, typeof User> = {
  [MessageRole.assistant]: Bot,
  [MessageRole.system]: Cpu,
  [MessageRole.user]: User,
};

interface PromptFormProps {
  defaultValues?: PromptFormValues;
  formId: string;
  onSubmit: (data: PromptFormValues) => void;
}

export function PromptForm({
  defaultValues,
  formId,
  onSubmit,
}: PromptFormProps) {
  const [editingIndex, setEditingIndex] = useState<null | number>(null);

  const form = useForm<PromptFormValues>({
    defaultValues: defaultValues || { name: "", promptFragments: [] },
    mode: "onTouched",
    resolver: zodResolver(promptFormSchema),
  });

  const watchedFragments = useWatch({
    control: form.control,
    name: "promptFragments",
  });

  const { append, fields, remove, replace } = useFieldArray({
    control: form.control,
    keyName: "_rhfId",
    name: "promptFragments",
  });

  function handleOrderChange(newFields: typeof fields) {
    const currentValues = form.getValues("promptFragments");
    replace(newFields.map((f) => currentValues[fields.indexOf(f)]));
  }

  const editingFragment = editingIndex !== null ? fields[editingIndex] : null;

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <FieldInput control={form.control} label="Name" name="name" />
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
                role: MessageRole.system,
                type: "content",
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
            const Icon = ROLE_ICONS[field.role];
            return (
              <div
                className={cn(
                  " flex items-center justify-between gap-2",
                  !watchedFragments[index].enabled && "opacity-50",
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
                  <span className="text-sm font-medium">
                    {watchedFragments[index]?.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {field.type === "inject" ? field.injectTag : "content"}
                  </span>
                  {field.type === "inject" ? (
                    <div className="flex size-7 shrink-0 items-center justify-center">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  ) : (
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
                      <Trash2 className="text-muted-foreground" />
                    </Button>
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
        <DialogContent>
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
              <Controller
                control={form.control}
                name={`promptFragments.${editingIndex}.role`}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Role</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
              {editingFragment?.type === "content" && (
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

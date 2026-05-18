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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AssistantIcon,
  DeleteIcon,
  HistoryIcon,
  LockedIcon,
  RegexIcon,
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
  const [promptEditingIndex, setPromptEditingIndex] = useState<null | number>(
    null,
  );
  const [regexEditingIndex, setRegexEditingIndex] = useState<null | number>(
    null,
  );

  const form = useForm<PromptFormValues>({
    defaultValues: defaultValues || {
      maxOutputTokens: 0,
      maxSteps: 20,
      maxTokens: 80000,
      name: "",
      prefetch: false,
      promptFragments: [],
      promptRegexes: [],
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

  const watchedRegex = useWatch({
    control: form.control,
    name: "promptRegexes",
  });

  const {
    append: appendPrompt,
    fields: promptFields,
    move: movePrompt,
    remove: removePrompt,
  } = useFieldArray({
    control: form.control,
    keyName: "_rhfId",
    name: "promptFragments",
  });

  const {
    append: appendRegex,
    fields: regexfields,
    move: moveRegex,
    remove: removeRegex,
  } = useFieldArray({
    control: form.control,
    keyName: "_rhfId",
    name: "promptRegexes",
  });

  /**
   * Computes the (from, to) indices for a single-item move given two snapshots of
   * a field array. Returns null if the arrays are identical.
   */
  function getFieldArrayMove<T>(
    oldFields: T[],
    newFields: T[],
    getKey: (item: T) => string,
  ): [number, number] | null {
    let firstDiff = 0;
    while (
      firstDiff < newFields.length &&
      getKey(newFields[firstDiff]) === getKey(oldFields[firstDiff])
    ) {
      firstDiff++;
    }
    let lastDiff = newFields.length - 1;
    while (
      lastDiff >= 0 &&
      getKey(newFields[lastDiff]) === getKey(oldFields[lastDiff])
    ) {
      lastDiff--;
    }
    if (firstDiff > lastDiff) return null;
    if (getKey(newFields[firstDiff]) === getKey(oldFields[lastDiff])) {
      return [lastDiff, firstDiff];
    }
    return [firstDiff, lastDiff];
  }

  function handlePromptOrderChange(newFields: typeof promptFields) {
    const move = getFieldArrayMove(promptFields, newFields, (f) => f._rhfId);
    if (move) movePrompt(...move);
  }

  function handleRegexOrderChange(newFields: typeof regexfields) {
    const move = getFieldArrayMove(regexfields, newFields, (f) => f._rhfId);
    if (move) moveRegex(...move);
  }

  const editingFragment =
    promptEditingIndex !== null ? promptFields[promptEditingIndex] : null;

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
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Prefetch Lorebook Entries</FieldLabel>
            <Controller
              control={form.control}
              name="prefetch"
              render={({ field: f }) => (
                <Switch checked={f.value} onCheckedChange={f.onChange} />
              )}
            />
          </div>
        </Field>
      </FieldGroup>
      <Tabs defaultValue="prompt">
        <TabsList>
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="regex">Regex</TabsTrigger>
        </TabsList>
        <TabsContent value="prompt">
          <FieldSet className="mt-6">
            <div className="flex items-center justify-between">
              <FieldLegend variant="label">Fragments</FieldLegend>
              <Button
                onClick={() =>
                  appendPrompt({
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
              items={promptFields}
              onItemClick={(field) =>
                setPromptEditingIndex(
                  promptFields.findIndex((f) => f._rhfId === field._rhfId),
                )
              }
              onOrderChange={handlePromptOrderChange}
              renderItem={(field, index) => {
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
                      <span className="text-sm font-medium">
                        {watched?.name}
                      </span>
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
                            removePrompt(index);
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
        </TabsContent>
        <TabsContent value="regex">
          <FieldSet className="mt-6">
            <div className="flex items-center justify-between">
              <FieldLegend variant="label">Regex</FieldLegend>
              <Button
                onClick={() =>
                  appendRegex({
                    enabled: true,
                    isShared: false,
                    name: "New Regex",
                    pattern: "",
                    target: "BOTH",
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
              items={regexfields}
              onItemClick={(field) =>
                setRegexEditingIndex(
                  regexfields.findIndex((f) => f._rhfId === field._rhfId),
                )
              }
              onOrderChange={handleRegexOrderChange}
              renderItem={(field, index) => {
                const watched = watchedRegex[index];
                return (
                  <div
                    className={cn(
                      " flex items-center justify-between gap-2",
                      !watched?.enabled && "opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RegexIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <Controller
                        control={form.control}
                        name={`promptRegexes.${index}.enabled`}
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
                        {watched?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeRegex(index);
                        }}
                        size="icon-sm"
                        type="button"
                        variant="destructive"
                      >
                        <DeleteIcon className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              }}
            ></SortableList>
          </FieldSet>
        </TabsContent>
      </Tabs>

      {/* Edit Prompt Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setPromptEditingIndex(null)}
        open={promptEditingIndex !== null}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fragment</DialogTitle>
          </DialogHeader>
          {promptEditingIndex !== null && (
            <FieldGroup>
              <Controller
                control={form.control}
                name={`promptFragments.${promptEditingIndex}.name`}
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
                  name={`promptFragments.${promptEditingIndex}.role`}
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
                  name={`promptFragments.${promptEditingIndex}.content`}
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

      {/* Regex Edit Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setRegexEditingIndex(null)}
        open={regexEditingIndex !== null}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Regex</DialogTitle>
          </DialogHeader>
          {regexEditingIndex !== null && (
            <FieldGroup>
              <Controller
                control={form.control}
                name={`promptRegexes.${regexEditingIndex}.name`}
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
                name={`promptRegexes.${regexEditingIndex}.pattern`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Pattern</FieldLabel>
                    <Input {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name={`promptRegexes.${regexEditingIndex}.target`}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Target</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="ASSISTANT">Assistant</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </FieldGroup>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </form>
  );
}

"use client";

import { CurrentLorebook } from "@/app/lorebook/_components/current-lorebook";
import { useLorebook } from "@/app/lorebook/_lib/hooks";
import { LorebookDto, LorebookStatus } from "@/app/lorebook/_lib/schema";
import { storyFormSchema, StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption, CardSelector } from "@/components/card-selector";
import { FieldInput } from "@/components/form-fields/field-input";
import { Badge } from "@/components/ui/badge";
import { Field, FieldError } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  BookOpen,
  Globe,
  UserCircle,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface StoryFormParams {
  formId: string;
  characters?: CardOption[];
  personas?: CardOption[];
  worlds?: CardOption[];
  isEdit?: boolean;
  defaultValues?: Partial<StoryFormValues>;
  onSubmit: (data: StoryFormValues) => void;
  currentLorebook: LorebookDto;
}

export function StoryForm({
  formId,
  defaultValues,
  characters,
  personas,
  worlds,
  isEdit,
  onSubmit,
  currentLorebook,
}: StoryFormParams) {
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      ...defaultValues,
      mode: isEdit ? "edit" : "create",
      name: defaultValues?.name ?? "",
    },
  });
  const { lorebook, error } = useLorebook({});
  const assignedLorebook = defaultValues?.lorebook;
  const currentLorebookName =
    lorebook?.status === LorebookStatus.Ready ? lorebook.name : undefined;

  const lorebookMismatch =
    !!assignedLorebook && assignedLorebook !== currentLorebookName;

  const [replaceWithCurrent, setReplaceWithCurrent] = useState(false);

  function handleReplaceToggle(checked: boolean) {
    setReplaceWithCurrent(checked);
    form.setValue("lorebook", checked ? currentLorebookName : assignedLorebook);
  }

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-4">
        {/* NAME ROW */}
        <div className="col-span-3">
          <FieldInput
            control={form.control}
            name="name"
            label="Name"
            placeholder={isEdit ? "Name" : "Leave blank for default"}
          />
        </div>

        {/* CARD ROW */}
        <div className="aspect-3/4 p-4">
          <Controller
            control={form.control}
            name="characterId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="h-full">
                <CardSelector
                  icon={Users}
                  label="Character"
                  options={characters}
                  selectedId={field.value}
                  onChange={(char) => field.onChange(char.id)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className="aspect-3/4 p-4">
          <Controller
            control={form.control}
            name="personaId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="h-full">
                <CardSelector
                  icon={UserCircle}
                  label="Persona"
                  options={personas}
                  selectedId={field.value}
                  onChange={(per) => field.onChange(per.id)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className="aspect-3/4 p-4">
          <Controller
            control={form.control}
            name="worldId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="h-full">
                <CardSelector
                  icon={Globe}
                  label="World"
                  options={worlds}
                  selectedId={field.value}
                  onChange={(world) => field.onChange(world.id)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        {/* LOREBOOK ROW */}
        <div className="col-span-3 space-y-2 rounded-lg border border-border p-4">
          {error && <p className="text-destructive">{error}</p>}
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="size-4" />
            Lorebook
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Assigned</span>
              <div className="mt-1">
                {assignedLorebook ? (
                  <Badge variant="outline">{assignedLorebook}</Badge>
                ) : (
                  <span className="text-muted-foreground italic">None</span>
                )}
              </div>
            </div>
            <CurrentLorebook initialLorebook={currentLorebook} />
          </div>

          {currentLorebookName && lorebookMismatch && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="size-4 shrink-0" />
              Assigned lorebook &ldquo;{assignedLorebook}&rdquo; differs from
              current lorebook &ldquo;{currentLorebookName}&rdquo;.
            </div>
          )}

          {currentLorebookName && currentLorebookName !== assignedLorebook && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={replaceWithCurrent}
                onChange={(e) => handleReplaceToggle(e.target.checked)}
                className="size-4 rounded border-border accent-primary"
              />
              {assignedLorebook
                ? "Replace assigned lorebook with current on story"
                : "Assign lorebook to story"}
            </label>
          )}
        </div>
      </div>
    </form>
  );
}

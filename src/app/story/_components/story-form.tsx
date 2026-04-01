"use client";

import { storyFormSchema, StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption, CardSelector } from "@/components/card-selector";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldSelect } from "@/components/form-fields/field-select";
import { Field, FieldError } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, UserCircle, Users } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

interface StoryFormParams {
  formId: string;
  characters?: CardOption[];
  personas?: CardOption[];
  worlds?: CardOption[];
  lorebooks: { value: string; label: string }[];
  isEdit?: boolean;
  defaultValues?: Partial<StoryFormValues>;
  onSubmit: (data: StoryFormValues) => void;
}

export function StoryForm({
  formId,
  defaultValues,
  characters,
  personas,
  worlds,
  lorebooks,
  isEdit,
  onSubmit,
}: StoryFormParams) {
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      ...defaultValues,
      mode: isEdit ? "edit" : "create",
      name: defaultValues?.name ?? "",
    },
  });

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
        <div className="col-span-3">
          <FieldSelect
            control={form.control}
            name="lorebookId"
            label="Lorebook"
            options={lorebooks}
          />
        </div>
      </div>
    </form>
  );
}

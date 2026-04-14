"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, UseFormSetError } from "react-hook-form";

import { storyFormSchema, StoryFormValues } from "@/app/story/_lib/schema";
import { CardOption, CardSelector } from "@/components/card-selector";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldSelect } from "@/components/form-fields/field-select";
import { Field, FieldError } from "@/components/ui/field";
import { CharacterIcon, PersonaIcon, WorldIcon } from "@/lib/icons";

interface StoryFormParams {
  characters?: CardOption[];
  defaultValues?: Partial<StoryFormValues>;
  formId: string;
  isEdit?: boolean;
  lorebooks: { label: string; value: string }[];
  onSubmit: (
    data: StoryFormValues,
    setError: UseFormSetError<StoryFormValues>,
  ) => void;
  personas?: CardOption[];
  prompts: { label: string; value: string }[];
  worlds?: CardOption[];
}

export function StoryForm({
  characters,
  defaultValues,
  formId,
  isEdit,
  lorebooks,
  onSubmit,
  personas,
  prompts,
  worlds,
}: StoryFormParams) {
  const form = useForm<StoryFormValues>({
    defaultValues: {
      ...defaultValues,
      mode: isEdit ? "edit" : "create",
      name: defaultValues?.name ?? "",
    },
    resolver: zodResolver(storyFormSchema),
  });

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit((data) => onSubmit(data, form.setError))}
    >
      <div className="grid grid-cols-3 gap-4">
        {/* NAME ROW */}
        <div className="col-span-3">
          <FieldInput
            control={form.control}
            label="Name"
            name="name"
            placeholder={isEdit ? "Name" : "Leave blank for default"}
          />
        </div>

        {/* CARD ROW */}
        <div className="aspect-3/4 p-4">
          <Controller
            control={form.control}
            name="characterId"
            render={({ field, fieldState }) => (
              <Field className="h-full" data-invalid={fieldState.invalid}>
                <CardSelector
                  icon={CharacterIcon}
                  label="Character"
                  onChange={(char) => field.onChange(char.id)}
                  options={characters}
                  selectedId={field.value}
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
              <Field className="h-full" data-invalid={fieldState.invalid}>
                <CardSelector
                  icon={PersonaIcon}
                  label="Persona"
                  onChange={(per) => field.onChange(per.id)}
                  options={personas}
                  selectedId={field.value}
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
              <Field className="h-full" data-invalid={fieldState.invalid}>
                <CardSelector
                  icon={WorldIcon}
                  label="World"
                  onChange={(world) => field.onChange(world.id)}
                  options={worlds}
                  selectedId={field.value}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        {/* PROMPT ROW */}
        <div className="col-span-3">
          <FieldSelect
            control={form.control}
            label="Prompt"
            name="promptId"
            options={prompts}
          />
        </div>

        {/* LOREBOOK ROW */}
        <div className="col-span-3">
          <FieldSelect
            control={form.control}
            label="Lorebook"
            name="lorebookId"
            options={lorebooks}
          />
        </div>
      </div>
    </form>
  );
}

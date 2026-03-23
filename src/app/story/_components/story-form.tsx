"use client";

import { CardOption, CardSelector } from "@/components/card-selector";
import { FieldInput } from "@/components/form-fields/field-input";
import { Field, FieldError } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, UserCircle, Users } from "lucide-react";
import { startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

const baseSchema = z.object({
  characterId: z.string(),
  personaId: z.string(),
  worldId: z.string().optional(),
  assignedLorebook: z.string().optional(),
});

export const storyFormSchema = z.discriminatedUnion("mode", [
  baseSchema.extend({
    mode: z.literal("create"),
    name: z.string().optional(),
  }),
  baseSchema.extend({
    mode: z.literal("edit"),
    name: z.string().min(1),
  }),
]);

export type StoryFormValues = z.infer<typeof storyFormSchema>;

interface StoryFormParams {
  formId: string;
  characters?: CardOption[];
  personas?: CardOption[];
  worlds?: CardOption[];
  isEdit?: boolean;
  defaultValues?: Partial<StoryFormValues>;
  formAction: (formData: FormData) => void;
  //   currentLorebook: {
  //     status: LorebookStatus;
  //     name?: string;
  //   };
}

export function StoryForm({
  formId,
  defaultValues,
  characters,
  personas,
  worlds,
  isEdit,
  formAction,
  //currentLorebook,
}: StoryFormParams) {
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      ...defaultValues,
      mode: isEdit ? "edit" : "create",
      name: defaultValues?.name ?? "",
    },
  });

  async function onSubmitHandler(data: StoryFormValues) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) formData.append(key, value);
    }
    startTransition(() => formAction(formData));
  }

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(onSubmitHandler)}
      action={formAction}
    >
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* LOREBOOK ROW */}
        {/* <div className="col-span-3">
          <Controller
            name="assignedLorebook"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${field.name}-input`}>
                  Lorebook
                </FieldLabel>
                <div className="flex gap-2">
                  <span>Assigned Lorebook:</span>
                  <span>{field.value}</span>
                </div>
                <div className="flex gap-2">
                  <CurrentLorebook lorebook={currentLorebook} />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div> */}
      </div>
    </form>
  );
}

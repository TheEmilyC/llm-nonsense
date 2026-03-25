"use client";

import { useForm } from "react-hook-form";

import {
  characterFormSchema,
  CharacterFormValues,
} from "@/app/character/schema";
import { FieldImageUpload } from "@/components/form-fields/field-image-upload";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldTagList } from "@/components/form-fields/field-taglist";
import { FieldTextareaField } from "@/components/form-fields/field-textarea";
import { FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";

interface CharacterFormProps {
  formId: string;
  defaultValues?: CharacterFormValues;
  imageSrc?: string;
  onSubmit: (data: CharacterFormValues) => void;
}

export function CharacterForm({
  formId,
  defaultValues,
  imageSrc,
  onSubmit,
}: CharacterFormProps) {
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormSchema),
    mode: "onTouched",
    defaultValues: defaultValues || {
      name: "",
      tags: [],
      description: "",
      personality: "",
      scenario: "",
      first_mes: "",
      mes_example: "",
      creator_notes: "",
    },
  });

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <FieldImageUpload
              control={form.control}
              name="image"
              label=""
              acceptedFormats="png"
              initialImgSrc={imageSrc}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-4">
            <FieldInput control={form.control} name="name" label="Name" />
            <FieldTagList control={form.control} name="tags" label="Tags" />
          </div>
          <div className="col-span-3 flex flex-col gap-4">
            <FieldTextareaField
              control={form.control}
              name="description"
              label="Description"
            />
            <FieldTextareaField
              control={form.control}
              name="personality"
              label="Personality"
            />
            <FieldTextareaField
              control={form.control}
              name="scenario"
              label="Scenario"
            />
            <FieldTextareaField
              control={form.control}
              name="first_mes"
              label="First Message"
            />
            <FieldTextareaField
              control={form.control}
              name="mes_example"
              label="Example Messages"
            />
            <FieldTextareaField
              control={form.control}
              name="creator_notes"
              label="Creator Notes"
            />
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}

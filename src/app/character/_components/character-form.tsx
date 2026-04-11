"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormSetError } from "react-hook-form";

import {
  characterFormSchema,
  CharacterFormValues,
} from "@/app/character/_lib/schema";
import { FieldImageUpload } from "@/components/form-fields/field-image-upload";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldTagList } from "@/components/form-fields/field-taglist";
import { FieldTextareaField } from "@/components/form-fields/field-textarea";
import { FieldGroup } from "@/components/ui/field";

interface CharacterFormProps {
  defaultValues?: CharacterFormValues;
  formId: string;
  imageSrc?: string;
  onSubmit: (
    data: CharacterFormValues,
    setError: UseFormSetError<CharacterFormValues>,
  ) => void;
}

export function CharacterForm({
  defaultValues,
  formId,
  imageSrc,
  onSubmit,
}: CharacterFormProps) {
  const form = useForm<CharacterFormValues>({
    defaultValues: defaultValues || {
      creator_notes: "",
      description: "",
      first_mes: "",
      mes_example: "",
      name: "",
      personality: "",
      scenario: "",
      tags: [],
    },
    mode: "onTouched",
    resolver: zodResolver(characterFormSchema),
  });

  return (
    <form id={formId} onSubmit={form.handleSubmit((data) => onSubmit(data, form.setError))}>
      <FieldGroup>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <FieldImageUpload
              acceptedFormats="png"
              control={form.control}
              initialImgSrc={imageSrc}
              label=""
              name="image"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-4">
            <FieldInput control={form.control} label="Name" name="name" />
            <FieldTagList control={form.control} label="Tags" name="tags" />
          </div>
          <div className="col-span-3 flex flex-col gap-4">
            <FieldTextareaField
              control={form.control}
              label="Description"
              name="description"
            />
            <FieldTextareaField
              control={form.control}
              label="Personality"
              name="personality"
            />
            <FieldTextareaField
              control={form.control}
              label="Scenario"
              name="scenario"
            />
            <FieldTextareaField
              control={form.control}
              label="First Message"
              name="first_mes"
            />
            <FieldTextareaField
              control={form.control}
              label="Example Messages"
              name="mes_example"
            />
            <FieldTextareaField
              control={form.control}
              label="Creator Notes"
              name="creator_notes"
            />
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}

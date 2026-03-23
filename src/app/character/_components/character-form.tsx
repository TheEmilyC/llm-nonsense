"use client";

import { startTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  characterFormSchema,
  CharacterFormValues,
} from "@/app/character/validators";
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
  formAction: (formData: FormData) => void;
}

export function CharacterForm({
  formId,
  defaultValues,
  imageSrc,
  formAction,
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

  const onSubmitHandler: SubmitHandler<CharacterFormValues> = async (data) => {
    // Required for client side validation to fire
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("personality", data.personality);
    formData.append("scenario", data.scenario);
    formData.append("first_mes", data.first_mes);
    formData.append("mes_example", data.mes_example);
    formData.append("creator_notes", data.creator_notes);
    if (data.image) formData.append("image", data.image);
    if (data.tags.length > 0) {
      data.tags.forEach((tag) => formData.append("tags", tag));
    }
    startTransition(() => formAction(formData));
  };

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmitHandler)}>
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { worldFormSchema, WorldFormValues } from "@/app/world/_lib/schema";
import { FieldImageUpload } from "@/components/form-fields/field-image-upload";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldTextareaField } from "@/components/form-fields/field-textarea";
import { FieldGroup } from "@/components/ui/field";

interface WorldFormProps {
  defaultValues?: WorldFormValues;
  formId: string;
  imageSrc?: string;
  onSubmit: (data: WorldFormValues) => void;
}

export function WorldForm({
  defaultValues,
  formId,
  imageSrc,
  onSubmit,
}: WorldFormProps) {
  const form = useForm<WorldFormValues>({
    defaultValues: defaultValues || {
      description: "",
      name: "",
    },
    mode: "onTouched",
    resolver: zodResolver(worldFormSchema),
  });

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <FieldImageUpload
              acceptedFormats="image"
              control={form.control}
              initialImgSrc={imageSrc}
              label=""
              name="image"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-4">
            <FieldInput control={form.control} label="Name" name="name" />
          </div>
          <div className="col-span-3 flex flex-col gap-4">
            <FieldTextareaField
              control={form.control}
              label="Description"
              name="description"
              rows={8}
            />
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}

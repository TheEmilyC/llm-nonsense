"use client";

import { worldFormSchema, WorldFormValues } from "@/app/world/_lib/schema";
import { FieldImageUpload } from "@/components/form-fields/field-image-upload";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldTextareaField } from "@/components/form-fields/field-textarea";
import { FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface WorldFormProps {
  formId: string;
  defaultValues?: WorldFormValues;
  imageSrc?: string;
  onSubmit: (data: WorldFormValues) => void;
}

export function WorldForm({
  formId,
  defaultValues,
  imageSrc,
  onSubmit,
}: WorldFormProps) {
  const form = useForm<WorldFormValues>({
    resolver: zodResolver(worldFormSchema),
    mode: "onTouched",
    defaultValues: defaultValues || {
      name: "",
      description: "",
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
              acceptedFormats="image"
              initialImgSrc={imageSrc}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-4">
            <FieldInput control={form.control} name="name" label="Name" />
          </div>
          <div className="col-span-3 flex flex-col gap-4">
            <FieldTextareaField
              control={form.control}
              name="description"
              label="Description"
              rows={8}
            />
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}

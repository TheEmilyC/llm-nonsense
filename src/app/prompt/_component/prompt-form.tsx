"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { promptFormSchema, PromptFormValues } from "@/app/prompt/_lib/schema";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldGroup } from "@/components/ui/field";

interface PromptFormProps {
  defaultValues?: PromptFormValues;
  formId: string;
  onSubmit: (data: PromptFormValues) => void;
}

export function PromptForm({ defaultValues, formId, onSubmit }: PromptFormProps) {
  const form = useForm<PromptFormValues>({
    defaultValues: defaultValues || { name: "" },
    mode: "onTouched",
    resolver: zodResolver(promptFormSchema),
  });

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <FieldInput control={form.control} label="Name" name="name" />
      </FieldGroup>
    </form>
  );
}

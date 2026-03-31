"use client";

import {
  lorebookDbFormSchema,
  LorebookDbFormValues,
} from "@/app/lorebook/_lib/schema";
import { FieldInput } from "@/components/form-fields/field-input";
import { FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface LorebookFormProps {
  formId: string;
  defaultValues?: LorebookDbFormValues;
  onSubmit: (data: LorebookDbFormValues) => void;
}

export function LorebookForm({
  formId,
  defaultValues,
  onSubmit,
}: LorebookFormProps) {
  const form = useForm<LorebookDbFormValues>({
    resolver: zodResolver(lorebookDbFormSchema),
    mode: "onTouched",
    defaultValues: defaultValues || { name: "", apiKey: "", port: 27123 },
  });

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <FieldInput control={form.control} name="name" label="Name" />
        <FieldInput
          control={form.control}
          name="port"
          label="Port"
          type="number"
        />
        <FieldInput control={form.control} name="apiKey" label="API Key" />
      </FieldGroup>
    </form>
  );
}

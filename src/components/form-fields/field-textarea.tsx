import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface FieldTextareaFieldParams<T extends FieldValues> {
  control: Control<T>;
  label: string;
  name: Path<T>;
  placeholder?: string;
  rows?: number;
}

export function FieldTextareaField<T extends FieldValues>({
  control,
  label,
  name,
  placeholder,
  rows,
}: FieldTextareaFieldParams<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <Textarea
            {...field}
            aria-invalid={fieldState.invalid}
            id={`${name}-input`}
            placeholder={placeholder || label}
            rows={rows || 4}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FieldTextareaFieldParams<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  rows?: number;
}

export function FieldTextareaField<T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
  rows,
}: FieldTextareaFieldParams<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <Textarea
            {...field}
            id={`${name}-input`}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder || label}
            rows={rows || 4}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

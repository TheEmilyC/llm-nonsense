import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FieldInputFieldParams<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
}

export function FieldInput<T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
}: FieldInputFieldParams<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <Input
            {...field}
            id={`${name}-input`}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder || label}
            autoComplete="off"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

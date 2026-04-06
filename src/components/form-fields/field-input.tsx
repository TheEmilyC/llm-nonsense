import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface FieldInputParams<T extends FieldValues> {
  control: Control<T>;
  label: string;
  name: Path<T>;
  placeholder?: string;
  type?: "email" | "number" | "password" | "text";
}

export function FieldInput<T extends FieldValues>({
  control,
  label,
  name,
  placeholder,
  type = "text",
}: FieldInputParams<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <Input
            {...field}
            aria-invalid={fieldState.invalid}
            autoComplete="off"
            id={`${name}-input`}
            onChange={(e) => {
              if (type === "number") {
                field.onChange(
                  e.target.value === "" ? undefined : e.target.valueAsNumber,
                );
              } else {
                field.onChange(e);
              }
            }}
            placeholder={placeholder || label}
            type={type}
            value={field.value ?? ""}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FieldInputFieldParams<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "password" | "email";
}

export function FieldInput<T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
  type = "text",
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
            type={type}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder || label}
            autoComplete="off"
            value={field.value ?? ""}
            onChange={(e) => {
              if (type === "number") {
                field.onChange(
                  e.target.value === "" ? undefined : e.target.valueAsNumber,
                );
              } else {
                field.onChange(e);
              }
            }}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

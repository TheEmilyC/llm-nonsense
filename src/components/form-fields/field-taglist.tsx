import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { TagList } from "@/components/tag-list";
import { Field, FieldLabel } from "@/components/ui/field";

interface FieldTagListParams<T extends FieldValues> {
  control: Control<T>;
  label: string;
  name: Path<T>;
  options?: string[];
}

export function FieldTagList<T extends FieldValues>({
  control,
  label,
  name,
  options,
}: FieldTagListParams<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <TagList
            name={name}
            onChange={field.onChange}
            options={options}
            value={field.value}
          />
        </Field>
      )}
    />
  );
}

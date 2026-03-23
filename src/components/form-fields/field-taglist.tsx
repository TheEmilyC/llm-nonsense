import { TagList } from "@/components/tag-list";
import { Field, FieldLabel } from "@/components/ui/field";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FieldTagListParams<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options?: string[];
}

export function FieldTagList<T extends FieldValues>({
  name,
  control,
  label,
  options,
}: FieldTagListParams<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <TagList
            value={field.value}
            onChange={field.onChange}
            options={options}
          />
        </Field>
      )}
    />
  );
}

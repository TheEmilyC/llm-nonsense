import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldSelectParams<T extends FieldValues> {
  control: Control<T>;
  emptyMessage?: string;
  label: string;
  name: Path<T>;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export function FieldSelect<T extends FieldValues>({
  control,
  emptyMessage,
  label,
  name,
  options,
  placeholder,
}: FieldSelectParams<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          {options.length === 0 ? (
            <p>{emptyMessage ?? "None Available"}</p>
          ) : (
            <Select
              name={field.name}
              onValueChange={field.onChange}
              value={field.value ?? ""}
            >
              <SelectTrigger
                aria-invalid={fieldState.invalid}
                asChild
                className="w-70"
                onReset={() => field.onChange(undefined)}
                value={field.value}
              >
                <SelectValue
                  defaultValue={field.value}
                  placeholder={placeholder || label}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {options.map((opt, idx) => (
                    <SelectItem key={idx} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </Field>
      )}
    />
  );
}

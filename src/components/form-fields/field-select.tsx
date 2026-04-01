import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FieldSelectParams<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  emptyMessage?: string;
}

export function FieldSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  options,
  emptyMessage,
}: FieldSelectParams<T>) {
  return (
    <Controller
      name={name}
      control={control}
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
                asChild
                className="w-70"
                aria-invalid={fieldState.invalid}
                value={field.value}
                onReset={() => field.onChange(undefined)}
              >
                <SelectValue
                  placeholder={placeholder || label}
                  defaultValue={field.value}
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

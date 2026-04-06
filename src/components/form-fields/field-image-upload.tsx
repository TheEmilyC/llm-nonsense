import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { ImageUpload } from "@/components/image-upload";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface FieldImageUploadParams<T extends FieldValues> {
  acceptedFormats: "image" | "png";
  control: Control<T>;
  initialImgSrc?: string;
  label: string;
  name: Path<T>;
}

export function FieldImageUpload<T extends FieldValues>({
  acceptedFormats,
  control,
  initialImgSrc,
  label,
  name,
}: FieldImageUploadParams<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <ImageUpload
            acceptedFormats={acceptedFormats}
            imageSrc={initialImgSrc}
            name={name}
            onChange={field.onChange}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

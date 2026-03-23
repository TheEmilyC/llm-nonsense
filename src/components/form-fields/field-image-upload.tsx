import { ImageUpload } from "@/components/image-upload";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FieldImageUploadParams<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  initialImgSrc?: string;
  acceptedFormats: "png" | "image";
}

export function FieldImageUpload<T extends FieldValues>({
  name,
  control,
  label,
  initialImgSrc,
  acceptedFormats,
}: FieldImageUploadParams<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>
          <ImageUpload
            imageSrc={initialImgSrc}
            onChange={field.onChange}
            acceptedFormats={acceptedFormats}
            name={name}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

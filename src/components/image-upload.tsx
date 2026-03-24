"use client";
import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploadParams {
  imageSrc?: string;
  onChange?: (newImage: File | null) => void;
  acceptedFormats: "png" | "image";
  name?: string;
}

export function ImageUpload({
  imageSrc,
  onChange,
  acceptedFormats,
  name,
}: ImageUploadParams) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    undefined,
  );
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const image = e.target.files?.[0];
    if (!image) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(image));

    onChange?.(image);
  }

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className="relative w-36 h-48 rounded-lg overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed cursor-pointer hover:border-foreground/40 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {imagePreview || imageSrc ? (
          <Image
            src={imagePreview || imageSrc || ""}
            alt={"Character Image"}
            width={144}
            height={192}
            className="object-cover w-full h-full"
            loading="eager"
          />
        ) : (
          <span className="text-xs text-muted-foreground text-center px-2">
            Click to upload {acceptedFormats === "png" ? "PNG" : "Image"}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={acceptedFormats === "png" ? "image/png" : "image/*"}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}

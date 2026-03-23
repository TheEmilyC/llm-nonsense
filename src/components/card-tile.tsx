"use client";

import Image from "next/image";

interface CharacterTileProps {
  src: string;
  name: string;
}

export function CardTile({ src, name }: CharacterTileProps) {
  return (
    <div className="relative rounded-lg overflow-hidden aspect-3/4 w-full h-full bg-muted">
      <Image
        src={src}
        alt={name}
        fill
        sizes="(min-width: 1024px) 272px, (min-width: 640px) 288px, calc(100vw - 48px)"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-3 py-3">
        <p className="text-white font-medium text-sm">{name}</p>
      </div>
    </div>
  );
}

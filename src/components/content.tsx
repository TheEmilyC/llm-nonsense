"use client";

interface ContentProps {
  children?: React.ReactNode;
}

export function Content({ children }: ContentProps) {
  return <div className="mx-auto max-w-4xl p-6">{children}</div>;
}

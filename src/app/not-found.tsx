import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="text-muted-foreground">
          The resource you were looking for could not be found.
        </p>
        <Link
          className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
          href="/"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

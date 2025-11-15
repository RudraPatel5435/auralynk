import { Link } from "@tanstack/react-router";

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">404 — Not Found</h1>
      <p className="text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/channels/@dev"
        className="mt-4 px-6 py-2 rounded-xl border bg-background hover:bg-accent transition"
      >
        Go Home
      </Link>
    </div>
  )
}

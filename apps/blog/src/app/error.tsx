"use client";

import Link from "next/link";

import { Container } from "@/app/(common)/container";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <Container className="mt-16 flex flex-col items-center text-center sm:mt-32">
      <h1 className="font-display font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-prose font-body text-muted-foreground">
        An unexpected error occurred while rendering this page.
        {error.digest ? ` (id: ${error.digest})` : ""}
      </p>
      <div className="mt-8 flex gap-4">
        <button
          className="font-medium text-primary text-sm underline-offset-4 hover:underline"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
        <Link
          className="font-medium text-muted-foreground text-sm underline-offset-4 hover:underline"
          href="/"
        >
          Go home
        </Link>
      </div>
    </Container>
  );
}

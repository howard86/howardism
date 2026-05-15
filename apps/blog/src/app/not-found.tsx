import Link from "next/link";

import { Container } from "@/app/(common)/container";

export default function NotFound() {
  return (
    <Container className="mt-16 flex flex-col items-center text-center sm:mt-32">
      <h1 className="font-display font-semibold text-5xl text-foreground tracking-tight sm:text-6xl">
        404
      </h1>
      <p className="mt-4 max-w-prose font-body text-muted-foreground">
        That article does not exist. It may have been renamed or moved.
      </p>
      <Link
        className="mt-8 font-medium text-primary text-sm underline-offset-4 hover:underline"
        href="/articles"
      >
        Back to the index
      </Link>
    </Container>
  );
}

import { Badge } from "@howardism/ui/components/badge";
import { Card } from "@howardism/ui/components/card";

export default function Newsletter() {
  return (
    <Card className="px-6 py-5">
      <div className="mb-3 font-medium font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.16em]">
        The quiet newsletter
      </div>
      <p className="mb-4 font-body text-[13px] text-muted-foreground">
        Once a month, maybe. Whenever I finish thinking about something. No
        tracking, no drip funnel, no growth hacks.
      </p>
      <form action="/api/subscription" method="POST">
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address field
          </label>
          <input
            aria-label="Email address"
            autoComplete="on"
            className="h-8 w-full rounded border border-border bg-card px-2.5 font-body text-[13px] text-foreground outline-none"
            id="newsletter-email"
            name="email"
            placeholder="Email address"
            required
            type="email"
          />
          <Badge asChild className="w-full cursor-pointer" variant="chip">
            <button type="submit">Subscribe</button>
          </Badge>
        </div>
      </form>
    </Card>
  );
}

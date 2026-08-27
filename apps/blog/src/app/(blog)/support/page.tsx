import type { Metadata } from "next";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";

import { PlatePage } from "../_shell/plate-page";

// The App Store Support URL points here. Apple's reviewer will open it and
// expect a working way to reach you plus a plain intro to the app.

// TODO(support): replace these placeholders with the real app details before launch.
const APP_NAME = "TODO — App Name";
const APP_TAGLINE =
  "TODO — one line describing what the app does and who it is for.";
const APP_PLATFORM = "iOS"; // TODO — confirm the platform(s).
const SUPPORT_EMAIL = "support@howardism.dev";

// TODO(support): replace with 3–5 real questions users actually ask.
const FAQ: { q: string; a: string }[] = [
  {
    q: "TODO — a common question about the app?",
    a: "TODO — a clear, short answer.",
  },
  {
    q: "TODO — another common question?",
    a: "TODO — the answer.",
  },
];

// TODO(support): list any known issues, or leave the fallback below.
const KNOWN_ISSUES: string[] = [];

const SUPPORT_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/support`;

export const dynamic = "error";

export const metadata: Metadata = {
  title: `${APP_NAME} — Support`,
  description: `Support, FAQ, and contact for ${APP_NAME}.`,
  alternates: { canonical: SUPPORT_URL },
  openGraph: { url: SUPPORT_URL },
};

export default function SupportPage() {
  return (
    <PlatePage header="none" plate="home" width="read">
      <DiscPageHeader
        eyebrowEnd="HOWARDISM"
        eyebrowStart="Support"
        title={`${APP_NAME} support`}
        variant="compact"
      />
      <div className="prose mt-8 max-w-none">
        <p>{APP_TAGLINE}</p>
        <p>
          {APP_NAME} is available on {APP_PLATFORM}. Found a bug, or have a
          question? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and I will get
          back to you.
        </p>

        <h2>Frequently asked questions</h2>
        <dl>
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt>{item.q}</dt>
              <dd>{item.a}</dd>
            </div>
          ))}
        </dl>

        <h2>Known issues</h2>
        {KNOWN_ISSUES.length > 0 ? (
          <ul>
            {KNOWN_ISSUES.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : (
          <p>No known issues at this time.</p>
        )}

        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. I aim
          to respond within a few days.
        </p>
      </div>
    </PlatePage>
  );
}

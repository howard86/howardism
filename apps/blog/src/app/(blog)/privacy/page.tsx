import type { Metadata } from "next";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";

import { PlatePage } from "../_shell/plate-page";

// The App Store Privacy Policy URL points here. Apple requires a privacy policy
// URL for every app, even one that collects no data.

const PRIVACY_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/privacy`;
const SUPPORT_EMAIL = "support@howardism.dev";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Privacy Policy — Howardism",
  description: "Privacy policy for the app.",
  alternates: { canonical: PRIVACY_URL },
  openGraph: { url: PRIVACY_URL },
};

export default function PrivacyPage() {
  return (
    <PlatePage header="none" plate="home" width="read">
      <DiscPageHeader
        eyebrowEnd="HOWARDISM"
        eyebrowStart="Privacy"
        title="Privacy policy"
        variant="compact"
      />
      <div className="prose mt-8 max-w-none">
        {/*
          TODO(privacy): replace everything inside this block with the privacy
          policy text you provide. The app collects no data ("Data Not
          Collected" in App Store Connect), so the policy can be short. Keep a
          "Last updated" date and a contact line pointing at the address below.
        */}
        <p>
          <strong>TODO — replace with your privacy policy text.</strong>
        </p>
        <p>
          Questions about this policy? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </PlatePage>
  );
}

"use client";

import Script from "next/script";
import { useReportWebVitals } from "next/web-vitals";

declare global {
  interface Window {
    gtag?: (type: string, event: string, payload: unknown) => void;
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

export default function GoogleAnalytics({
  measurementId,
}: GoogleAnalyticsProps) {
  useReportWebVitals((metric) => {
    if (!window.gtag) {
      return;
    }

    window.gtag("event", metric.name, {
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ), // values must be integers
      event_label: metric.id, // id unique to current page load
      non_interaction: true, // avoids affecting bounce rate.
    });
  });

  return (
    <>
      {/* ponytail: shim must load beforeInteractive and the gtag.js library must
          stay lazyOnload — the shim buffers calls into window.dataLayer until the
          166 KB library arrives at idle. Reverting either strategy to the default
          re-races the library against LCP without gaining anything. */}
      <Script id="google-analytics" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${measurementId}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
    </>
  );
}

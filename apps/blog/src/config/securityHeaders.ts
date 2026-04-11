interface SecurityHeaderOptions {
  geolocation: "()" | "(self)";
}

interface Header {
  key: string;
  value: string;
}

export const getSecurityHeaders = ({
  geolocation,
}: SecurityHeaderOptions): Header[] => [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: `camera=(), microphone=(), geolocation=${geolocation}`,
  },
];

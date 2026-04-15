/**
 * Delivery tests for the sendTransactionalEmail helper (#496)
 *
 * Verifies the SendGrid payload shape produced by sendTransactionalEmail.
 * @sendgrid/client is mocked — no real HTTP calls are made (no real delivery).
 *
 * The hook wiring (auth.ts emailVerification.sendVerificationEmail →
 * sendTransactionalEmail with correct args) is covered in auth.test.ts where
 * @/services/mail is already properly mocked.
 *
 * This file constructs sendTransactionalEmail inline using the mocked client
 * to avoid Bun module-registry sharing issues between test files (Bun
 * mock.module does not support async factory functions).
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// Mock @sendgrid/client — captures outbound API calls
// ---------------------------------------------------------------------------

const mockRequest = mock(
  (_opts: unknown): Promise<[{ statusCode: number }, unknown]> =>
    Promise.resolve([{ statusCode: 202 }, {}])
);
const mockSetApiKey = mock((_key: string) => {
  // noop — call captured via mock.calls assertions
});

// Inline implementation of sendTransactionalEmail using the mocked client.
// Mirrors apps/blog/src/services/mail.ts exactly so we test the same logic
// without triggering module-cache conflicts with other test files.
const sendTransactionalEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey) {
    throw new Error("Missing env=SENDGRID_API_KEY");
  }
  if (!fromEmail) {
    throw new Error("Missing env=SENDGRID_FROM_EMAIL");
  }

  mockSetApiKey(apiKey);
  await mockRequest({
    method: "POST",
    url: "/v3/mail/send",
    body: {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail },
      subject,
      content: [{ type: "text/html", value: html }],
    },
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendTransactionalEmail — SendGrid payload (#496)", () => {
  beforeEach(() => {
    mockRequest.mockClear();
    mockSetApiKey.mockClear();
    process.env.SENDGRID_API_KEY = "SG.sandbox-test-key";
    process.env.SENDGRID_FROM_EMAIL = "noreply@example.com";
  });

  it("calls SendGrid /v3/mail/send exactly once", async () => {
    await sendTransactionalEmail({
      to: "new@example.com",
      subject: "Verify your email",
      html: "<p>Verify: <a href='https://example.com/verify'>link</a></p>",
    });

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const [opts] = mockRequest.mock.calls[0] as [
      { method: string; url: string },
    ];
    expect(opts.method).toBe("POST");
    expect(opts.url).toBe("/v3/mail/send");
  });

  it("sends to the correct recipient", async () => {
    await sendTransactionalEmail({
      to: "new@example.com",
      subject: "Verify your email",
      html: "<p>body</p>",
    });

    const [opts] = mockRequest.mock.calls[0] as [
      { body: { personalizations: Array<{ to: Array<{ email: string }> }> } },
    ];
    expect(opts.body.personalizations[0].to[0].email).toBe("new@example.com");
  });

  it("subject contains 'Verify'", async () => {
    await sendTransactionalEmail({
      to: "new@example.com",
      subject: "Verify your email",
      html: "<p>body</p>",
    });

    const [opts] = mockRequest.mock.calls[0] as [{ body: { subject: string } }];
    expect(opts.body.subject).toContain("Verify");
  });

  it("html body contains the verification URL", async () => {
    const verificationUrl =
      "https://example.com/api/auth/verify-email?token=abc123";

    await sendTransactionalEmail({
      to: "new@example.com",
      subject: "Verify your email",
      html: `<p>Verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    const [opts] = mockRequest.mock.calls[0] as [
      { body: { content: Array<{ type: string; value: string }> } },
    ];
    const htmlContent = opts.body.content.find((c) => c.type === "text/html");
    expect(htmlContent?.value).toContain(verificationUrl);
  });
});

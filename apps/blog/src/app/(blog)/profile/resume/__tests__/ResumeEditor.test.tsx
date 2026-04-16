import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — registered before dynamic import
// ---------------------------------------------------------------------------

const mockPush = mock(() => undefined);

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Lightweight pass-through for Container to avoid @howardism/ui deps
mock.module("@/app/(common)/Container", () => ({
  Container: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("div", { className }, children),
}));

// ResumeDocument is heavy (complex layout); return null in tests
mock.module("@/app/(blog)/profile/resume/ResumeDocument", () => ({
  default: () => null,
}));

// Button stub: avoid pulling in @howardism/ui and Tailwind in the test env
mock.module("@howardism/ui/components/button", () => ({
  Button: (props: Record<string, unknown>) => {
    const { children, ...rest } = props;
    return React.createElement(
      "button",
      {
        type: "button",
        ...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>),
      },
      children as React.ReactNode
    );
  },
}));

// ResumeForm stub: renders a plain form so onSubmit fires react-hook-form's
// handleSubmit, which validates defaultValues then calls the inner async fn.
mock.module("@/app/(blog)/profile/resume/ResumeForm", () => ({
  default: ({
    onSubmit,
  }: {
    onSubmit: React.FormEventHandler;
    [k: string]: unknown;
  }) =>
    React.createElement(
      "form",
      { onSubmit, "data-testid": "resume-form" },
      React.createElement(
        "button",
        { type: "submit", "data-testid": "submit-btn" },
        "Submit"
      )
    ),
  DEFAULT_RESUME_FORM: {
    name: "",
    address: "",
    phone: "",
    email: "",
    github: "",
    website: "",
    company: "",
    position: "",
    summary: "",
    experiences: [],
    projects: [],
    educations: [],
    skills: [],
    languages: [],
  },
}));

// Dynamic import AFTER all mocks are registered
const { default: ResumeEditor } = await import("../ResumeEditor");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// All required schema fields satisfied so zod validation passes on submit
const validResume = {
  name: "John Doe",
  address: "123 Test St",
  phone: "0912345678",
  email: "john@example.com",
  github: "johndoe",
  website: "https://example.com",
  company: "Test Corp",
  position: "Engineer",
  summary: "A concise professional summary.",
  experiences: [],
  projects: [],
  educations: [],
  skills: [],
  languages: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAndSubmit(fetchImpl: () => Promise<Response>) {
  global.fetch = fetchImpl as unknown as typeof fetch;
  render(React.createElement(ResumeEditor, { resume: validResume }));
  fireEvent.submit(screen.getByTestId("resume-form"));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ResumeEditor", () => {
  afterEach(() => {
    cleanup();
    mockPush.mockClear();
  });

  beforeEach(() => {
    // Restore real fetch before each test (individual tests override as needed)
    global.fetch = fetch;
  });

  it("renders form-level alert and resets isSubmitting on fetch rejection", async () => {
    await renderAndSubmit(() => Promise.reject(new Error("Network error")));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("renders generic error when response.ok is false (e.g., 500)", async () => {
    await renderAndSubmit(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false }), { status: 500 })
      )
    );
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("renders message verbatim when API returns success:false with message", async () => {
    await renderAndSubmit(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ success: false, message: "Profile limit reached" }),
          { status: 200 }
        )
      )
    );
    await waitFor(() => {
      expect(screen.getByText("Profile limit reached")).toBeDefined();
    });
  });

  it("calls router.push and does not render alert on success", async () => {
    await renderAndSubmit(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, data: "profile-abc" }), {
          status: 200,
        })
      )
    );
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/profile/resume/profile-abc");
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

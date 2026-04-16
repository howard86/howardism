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

// zodResolver — always passes validation with fakeSubmitData so every test
// drives the fetch/redirect path regardless of actual form field state.
const fakeSubmitData = {
  name: "John Doe",
  email: "john@example.com",
  items: [{ id: "clk496ee1000008jia9426s1z", quantity: 2 }],
};

mock.module("@hookform/resolvers/zod", () => ({
  zodResolver: () => async () => ({ values: fakeSubmitData, errors: {} }),
}));

// Heavy UI / icon dependencies — stub so no Tailwind/UI bundle is needed.
mock.module("@heroicons/react/24/outline", () => ({
  TrashIcon: () => null,
}));

mock.module("@howardism/ui/components/button", () => ({
  Button: (props: Record<string, unknown>) => {
    const { children, onClick, disabled, type } = props;
    return React.createElement(
      "button",
      {
        type: (type as string) ?? "button",
        onClick: onClick as React.MouseEventHandler,
        disabled: disabled as boolean,
      },
      children as React.ReactNode
    );
  },
}));

mock.module("@/app/(common)/FormInput", () => ({
  default: () => null,
}));

mock.module("@/app/(common)/FormSelect", () => ({
  default: () => null,
}));

mock.module("@/app/(blog)/tools/checkout/ProductOption", () => ({
  default: () => null,
}));

// validateRedirectUrl — controllable per-test via mockImplementationOnce.
const mockValidateRedirectUrl = mock(
  (_url: string, _origin: string): string =>
    "https://sandbox-web-pay.line.me/pay/confirm?transactionId=99999"
);

mock.module("@/app/(blog)/tools/checkout/validateRedirectUrl", () => ({
  validateRedirectUrl: mockValidateRedirectUrl,
}));

// Dynamic import AFTER all mocks are registered.
const { default: CheckoutForm } = await import("../CheckoutForm");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeProducts = {
  ids: ["clk496ee1000008jia9426s1z"],
  entities: {
    clk496ee1000008jia9426s1z: {
      id: "clk496ee1000008jia9426s1z",
      title: "Black T-Shirt M",
      price: 1000,
      color: "Black",
      size: "M",
      imageUrl: "/shirt.jpg",
      imageAlt: "Black T-Shirt",
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAndSubmit(fetchImpl: () => Promise<Response>) {
  global.fetch = fetchImpl as unknown as typeof fetch;
  render(
    React.createElement(CheckoutForm, {
      products: fakeProducts,
      shippingCost: 60,
    })
  );
  const form = document.querySelector("form");
  if (!form) {
    throw new Error("form element not found in rendered output");
  }
  fireEvent.submit(form);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CheckoutForm", () => {
  let mockAssign: ReturnType<typeof mock>;

  beforeEach(() => {
    global.fetch = fetch;
    mockValidateRedirectUrl.mockClear();

    // Replace window.location so we can spy on assign() without happy-dom
    // actually navigating, and control window.location.origin.
    mockAssign = mock(() => undefined);
    Object.defineProperty(globalThis, "location", {
      writable: true,
      configurable: true,
      value: {
        href: "",
        origin: "http://localhost",
        assign: mockAssign,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders form-level alert on fetch rejection", async () => {
    renderAndSubmit(() => Promise.reject(new Error("Network failure")));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("renders generic error when response.ok is false (e.g. 502)", async () => {
    renderAndSubmit(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false }), { status: 502 })
      )
    );
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("renders message verbatim when API returns success:false with message", async () => {
    renderAndSubmit(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: false,
            message: "Payment gateway unavailable",
          }),
          { status: 200 }
        )
      )
    );
    await waitFor(() => {
      expect(screen.getByText("Payment gateway unavailable")).toBeDefined();
    });
  });

  it("renders error and does not navigate when validateRedirectUrl throws", async () => {
    mockValidateRedirectUrl.mockImplementationOnce(() => {
      throw new Error("Redirect to external URL is not allowed");
    });

    renderAndSubmit(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ success: true, data: "javascript:alert(1)" }),
          { status: 200 }
        )
      )
    );

    await waitFor(() => {
      expect(
        screen.getByText("Redirect to external URL is not allowed")
      ).toBeDefined();
    });
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("calls window.location.assign with the LINE Pay URL on success", async () => {
    renderAndSubmit(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: "https://sandbox-web-pay.line.me/pay/confirm?transactionId=99999",
          }),
          { status: 200 }
        )
      )
    );

    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith(
        "https://sandbox-web-pay.line.me/pay/confirm?transactionId=99999"
      );
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

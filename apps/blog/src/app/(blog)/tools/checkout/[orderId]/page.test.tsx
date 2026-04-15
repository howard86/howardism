import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// Integration-style test for OrderPage.
//
// Mocking boundary: @/lib/auth (not better-auth / next/navigation chains).
// When Bun 1.3.x runs multiple test files in the same process, mock.module
// calls share state across files.  auth.test.ts mocks better-auth with its
// own mockGetSession variable, so re-mocking better-auth here doesn't
// override it.  Mocking @/lib/auth directly avoids that shared-state hazard
// and produces a more focused test: we verify that the *page* correctly uses
// requireSessionForPage and the ownership-enforced Prisma query.
// requireSessionForPage's own behaviour is already unit-tested in auth.test.ts.
// ---------------------------------------------------------------------------

// --- fixtures ---

const fakeSession = {
  user: {
    id: "user-1",
    email: "owner@example.com",
    name: "Owner User",
    emailVerified: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  session: {
    id: "sess-1",
    userId: "user-1",
    token: "tok-abc",
    expiresAt: new Date("2099-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
};

const fakeOrder = {
  email: "owner@example.com",
  name: "Owner User",
  totalPrice: { toNumber: () => 1200 },
  transactions: [{ status: "COMPLETED" }],
  products: [
    {
      quantity: 1,
      product: {
        id: "prod-1",
        title: "Test T-Shirt",
        price: { toNumber: () => 1080 },
        color: "Black",
        size: "M",
        imageUrl: "/shirt.jpg",
        imageAlt: "Black T-Shirt",
      },
    },
  ],
};

// --- mutable fixtures ---
let nextSession: typeof fakeSession | null = null;
let nextOrder: typeof fakeOrder | null = null;

// Mock requireSessionForPage: returns session or throws to simulate redirect.
const mockRequireSessionForPage = mock(
  async (_callbackUrl?: string) => nextSession
);

const mockFindUnique = mock(async () => nextOrder);

// --- module mocks ---

// Control requireSessionForPage at the auth boundary.
mock.module("@/lib/auth", () => ({
  requireSessionForPage: mockRequireSessionForPage,
}));

mock.module("@/services/prisma", () => ({
  default: {
    commerceOrder: { findUnique: mockFindUnique },
  },
}));

mock.module("next/image", () => ({ default: () => null }));

mock.module("@/app/(common)/SimpleLayout", () => ({
  SimpleLayout: ({
    children,
  }: {
    children: unknown;
    title: string;
    intro: string;
  }) => children,
}));

// Dynamic import after all mocks are registered.
const { default: OrderPage } = await import("./page");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OrderPage", () => {
  beforeEach(() => {
    nextSession = null;
    nextOrder = null;
    mockRequireSessionForPage.mockClear();
    mockFindUnique.mockClear();
  });

  it("calls requireSessionForPage with the orderId callbackUrl and propagates redirect", async () => {
    // Simulate what the real requireSessionForPage does when session is null:
    // it calls redirect() which throws NEXT_REDIRECT.
    mockRequireSessionForPage.mockImplementationOnce(
      (_callbackUrl?: string): Promise<typeof fakeSession> => {
        throw Object.assign(new Error("NEXT_REDIRECT"), {
          digest: "NEXT_REDIRECT",
        });
      }
    );
    await expect(
      OrderPage({ params: Promise.resolve({ orderId: "order-abc" }) })
    ).rejects.toThrow("NEXT_REDIRECT");
    // Page must pass the correct orderId-specific callbackUrl to the helper.
    expect(mockRequireSessionForPage).toHaveBeenCalledWith(
      "/tools/checkout/order-abc"
    );
  });

  it("calls notFound() when session exists but order is not found (non-owner OR missing id)", async () => {
    nextSession = fakeSession;
    // nextOrder = null — Prisma WHERE id+email returns null for both cases
    // notFound() throws (its actual Next.js impl or the shared mock from
    // auth.test.ts, which also throws).
    await expect(
      OrderPage({ params: Promise.resolve({ orderId: "order-abc" }) })
    ).rejects.toThrow();
    // Ownership-enforced single query: both id AND email in WHERE clause.
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-abc", email: "owner@example.com" },
      })
    );
  });

  it("renders order for authenticated owner with matching email", async () => {
    nextSession = fakeSession;
    nextOrder = fakeOrder;
    const result = await OrderPage({
      params: Promise.resolve({ orderId: "order-abc" }),
    });
    expect(result).toBeTruthy();
    // Verify the ownership-enforced single query is used.
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-abc", email: "owner@example.com" },
      })
    );
  });

  // ── Status-driven copy ────────────────────────────────────────────────────
  // OrderPage is a React Server Component: it returns a React element tree,
  // not rendered HTML. The SimpleLayout mock is not "called" as a function
  // during this process — React component functions only run during rendering
  // (reconciliation). We therefore inspect the returned element's props
  // directly: { type: SimpleLayout, props: { title, intro, children } }.

  it("COMPLETED status: shows thank-you title and shipped intro", async () => {
    nextSession = fakeSession;
    nextOrder = { ...fakeOrder, transactions: [{ status: "COMPLETED" }] };

    const el = (await OrderPage({
      params: Promise.resolve({ orderId: "order-1a2b3c" }),
    })) as any;
    expect(el.props.title).toBe("Thank you!");
    expect(el.props.intro).toContain("shipped");
  });

  it("PENDING status: shows payment-pending title and pending intro", async () => {
    nextSession = fakeSession;
    nextOrder = { ...fakeOrder, transactions: [{ status: "PENDING" }] };

    const el = (await OrderPage({
      params: Promise.resolve({ orderId: "order-1a2b3c" }),
    })) as any;
    expect(el.props.title).toContain("Pending");
    expect(el.props.intro).toContain("awaiting");
  });

  it("FAILED status: shows payment-failed title and retry intro", async () => {
    nextSession = fakeSession;
    nextOrder = { ...fakeOrder, transactions: [{ status: "FAILED" }] };

    const el = (await OrderPage({
      params: Promise.resolve({ orderId: "order-1a2b3c" }),
    })) as any;
    expect(el.props.title).toContain("Failed");
    expect(el.props.intro).toContain("unable");
  });

  it("CANCELLED status: shows cancelled title and cancelled intro", async () => {
    nextSession = fakeSession;
    nextOrder = { ...fakeOrder, transactions: [{ status: "CANCELLED" }] };

    const el = (await OrderPage({
      params: Promise.resolve({ orderId: "order-1a2b3c" }),
    })) as any;
    expect(el.props.title).toContain("Cancelled");
    expect(el.props.intro).toContain("cancelled");
  });

  it("empty transactions: falls back to NONE copy", async () => {
    nextSession = fakeSession;
    nextOrder = { ...fakeOrder, transactions: [] };

    const el = (await OrderPage({
      params: Promise.resolve({ orderId: "order-1a2b3c" }),
    })) as any;
    // Unknown/NONE status should produce a neutral fallback, not crash.
    expect(el.props.title).toBeTruthy();
    expect(el.props.intro).toBeTruthy();
  });

  it("unknown status: falls back to NONE copy without crashing", async () => {
    nextSession = fakeSession;
    nextOrder = {
      ...fakeOrder,
      transactions: [{ status: "SOME_FUTURE_STATUS" }],
    };

    const el = (await OrderPage({
      params: Promise.resolve({ orderId: "order-1a2b3c" }),
    })) as any;
    expect(el.props.title).toBeTruthy();
    expect(el.props.intro).toBeTruthy();
  });
});

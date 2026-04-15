import { type NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_SHIPPING_COST,
  DEFAULT_TAX_RATE,
} from "@/app/(blog)/tools/checkout/constants";
import { checkoutSchema } from "@/app/(blog)/tools/checkout/schema";
import { requireSessionForRoute } from "@/lib/auth";
import { RequestApiReturnCode, requestApi } from "@/services/line-pay";
import prisma from "@/services/prisma";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// POST /api/checkout — create order + PENDING transaction, then initiate LINE Pay
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSessionForRoute();
    if (!authResult.ok) {
      return authResult.response;
    }

    const rawBody = await request.json();
    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "Invalid request body",
        },
        { status: 400 }
      );
    }

    const { name, items } = parsed.data;
    const sessionEmail = authResult.session.user.email;

    // Fetch server-side prices — never trust client-submitted amounts.
    const productIds = items.map((i) => i.id);
    const products = await prisma.commerceProduct.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, price: true },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        { success: false, message: "One or more products not found" },
        { status: 400 }
      );
    }

    const priceMap = new Map(products.map((p) => [p.id, p.price.toNumber()]));

    const subTotal = items.reduce(
      (sum, item) => sum + (priceMap.get(item.id) ?? 0) * item.quantity,
      0
    );
    const totalPrice =
      subTotal + DEFAULT_SHIPPING_COST + subTotal * DEFAULT_TAX_RATE;

    // Atomically persist order + PENDING transaction BEFORE any network call.
    // Returns transactionId so we can mark it FAILED if LINE Pay rejects.
    const { order, transactionId } = await prisma.$transaction(async (tx) => {
      const created = await tx.commerceOrder.create({
        data: {
          email: sessionEmail,
          name,
          status: "PENDING",
          totalPrice,
          products: {
            create: items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          },
        },
      });

      const transaction = await tx.commerceTransaction.create({
        data: {
          orderId: created.id,
          amount: totalPrice,
          currency: "TWD",
          status: "PENDING",
        },
      });

      return { order: created, transactionId: transaction.id };
    });

    // Derive absolute redirect URLs from the inbound request origin.
    const origin = new URL(request.url).origin;

    // Wrap LINE Pay call so both returnCode failures and fetch throws
    // (AbortError, HTTP 4xx/5xx via T2 hardening) produce 502 + FAILED update.
    try {
      const linePayResponse = await requestApi({
        amount: Math.round(totalPrice),
        currency: "TWD",
        orderId: order.id,
        packages: [
          {
            id: order.id,
            amount: Math.round(totalPrice),
            products: items.map((item) => ({
              name: products.find((p) => p.id === item.id)?.title ?? item.id,
              quantity: item.quantity,
              price: Math.round(priceMap.get(item.id) ?? 0),
            })),
          },
        ],
        redirectUrls: {
          confirmUrl: `${origin}/api/checkout/confirm?orderId=${order.id}`,
          cancelUrl: `${origin}/tools/checkout`,
        },
      });

      if (linePayResponse.returnCode === RequestApiReturnCode.Success) {
        return NextResponse.json({
          success: true,
          data: linePayResponse.info.paymentUrl.web,
        });
      }

      // Non-success returnCode from LINE Pay
      const message = `LINE Pay error ${linePayResponse.returnCode}: ${linePayResponse.returnMessage}`;
      console.error(
        `LINE Pay failed: ${linePayResponse.returnCode} ${linePayResponse.returnMessage}`
      );
      await prisma.commerceTransaction.update({
        where: { id: transactionId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ success: false, message }, { status: 502 });
    } catch (linePayError) {
      // fetch throw — AbortError (timeout), HTTP error from T2 hardening, etc.
      const message =
        linePayError instanceof Error
          ? linePayError.message
          : "LINE Pay request failed";
      console.error(`LINE Pay failed: ${message}`);
      await prisma.commerceTransaction.update({
        where: { id: transactionId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ success: false, message }, { status: 502 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

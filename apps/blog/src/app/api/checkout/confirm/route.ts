import { type NextRequest, NextResponse } from "next/server";

import { ConfirmApiReturnCode, confirmApi } from "@/services/line-pay";
import prisma from "@/services/prisma";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/checkout/confirm?orderId=...&transactionId=...
//
// LINE Pay redirects the shopper back here after they approve the payment.
// The request is NOT carrying our Better Auth session — the shopper is
// effectively authenticated by knowing the (orderId, transactionId) pair that
// we gave LINE Pay upstream. LINE Pay's `confirm` endpoint is the real
// authority: it only accepts the exact amount/currency/transactionId tuple
// it issued, so an attacker guessing an orderId cannot flip an order to
// COMPLETED — LINE Pay would refuse.
//
// The handler is idempotent: a transaction that is already COMPLETED or
// FAILED short-circuits back to the detail page without re-calling LINE Pay.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const transactionId = url.searchParams.get("transactionId");

  if (!(orderId && transactionId)) {
    return NextResponse.redirect(
      new URL("/tools/checkout?error=missing_params", url.origin)
    );
  }

  const detailUrl = new URL(`/tools/checkout/${orderId}`, url.origin);

  const order = await prisma.commerceOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, amount: true, currency: true, status: true },
      },
    },
  });

  if (!order) {
    return NextResponse.redirect(detailUrl);
  }

  const tx = order.transactions[0];
  if (!tx || tx.status !== "PENDING") {
    return NextResponse.redirect(detailUrl);
  }

  try {
    const result = await confirmApi(transactionId, {
      amount: tx.amount.toNumber(),
      currency: tx.currency,
    });

    if (result.returnCode === ConfirmApiReturnCode.Success) {
      await prisma.$transaction([
        prisma.commerceTransaction.update({
          where: { id: tx.id },
          data: { status: "COMPLETED" },
        }),
        prisma.commerceOrder.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        }),
      ]);
    } else {
      console.error(
        `LINE Pay confirm failed: ${result.returnCode} ${result.returnMessage}`
      );
      await prisma.$transaction([
        prisma.commerceTransaction.update({
          where: { id: tx.id },
          data: { status: "FAILED" },
        }),
        prisma.commerceOrder.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        }),
      ]);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LINE Pay confirm failed";
    console.error(`LINE Pay confirm threw: ${message}`);
    await prisma.$transaction([
      prisma.commerceTransaction.update({
        where: { id: tx.id },
        data: { status: "FAILED" },
      }),
      prisma.commerceOrder.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      }),
    ]);
  }

  return NextResponse.redirect(detailUrl);
}

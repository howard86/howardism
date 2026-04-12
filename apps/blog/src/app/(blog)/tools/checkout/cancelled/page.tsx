import { SimpleLayout } from "@/app/(common)/SimpleLayout";
import { requireSessionForPage } from "@/lib/auth";

// TODO: handle more errors
export default async function CheckoutCancelledPage() {
  await requireSessionForPage("/tools/checkout/cancelled");

  return (
    <SimpleLayout intro="You have cancelled this order" title="Order cancelled">
      <p>Thank you for your interest!</p>
    </SimpleLayout>
  );
}

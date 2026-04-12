import { SimpleLayout } from "@/app/(common)/SimpleLayout";
import { requireSessionForPage } from "@/lib/auth";

import CheckoutForm from "./CheckoutForm";
import { DEFAULT_SHIPPING_COST } from "./constants";

export default async function CheckoutPage() {
  await requireSessionForPage("/tools/checkout");

  return (
    <SimpleLayout
      intro="LINE pay integration with mocked product info for demonstration purpose"
      title="Checkout Demo"
    >
      <CheckoutForm
        products={{ entities: {}, ids: [] }}
        shippingCost={DEFAULT_SHIPPING_COST}
      />
    </SimpleLayout>
  );
}

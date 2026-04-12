import { SimpleLayout } from "@/app/(common)/SimpleLayout";
import { requireSessionForPage } from "@/lib/auth";

// add order and payment details
export default async function CheckoutSuccessPage() {
  await requireSessionForPage("/tools/checkout/success");

  return (
    <SimpleLayout
      intro="You have successfully completed this order"
      title="Order complete"
    >
      <p>Thank you for purchasing!</p>
    </SimpleLayout>
  );
}

import { SimpleLayout } from "@/app/(common)/SimpleLayout";

// add order and payment details
export default function CheckoutSuccessPage() {
  return (
    <SimpleLayout
      intro="You have successfully completed this order"
      title="Order complete"
    >
      <p>Thank you for purchasing!</p>
    </SimpleLayout>
  );
}

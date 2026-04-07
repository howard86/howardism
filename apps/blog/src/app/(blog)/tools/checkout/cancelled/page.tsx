import { SimpleLayout } from "@/app/(common)/SimpleLayout";

// TODO: handle more errors
export default function CheckoutCancelledPage() {
  return (
    <SimpleLayout intro="You have cancelled this order" title="Order cancelled">
      <p>Thank you for your interest!</p>
    </SimpleLayout>
  );
}

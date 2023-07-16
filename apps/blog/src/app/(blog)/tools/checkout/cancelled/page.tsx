import { SimpleLayout } from "@/app/(common)/SimpleLayout"

// TODO: handle more errors
export default function CheckoutCancelledPage() {
  return (
    <SimpleLayout title="Order cancelled" intro="You have cancelled this order">
      <p>Thank you for your interest!</p>
    </SimpleLayout>
  )
}

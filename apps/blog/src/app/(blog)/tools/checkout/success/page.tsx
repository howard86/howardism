import { SimpleLayout } from "@/app/(common)/SimpleLayout"

// add order and payment details
export default function CheckoutSuccessPage() {
  return (
    <SimpleLayout title="Order complete" intro="You have successfully completed this order">
      <p>Thank you for purchasing!</p>
    </SimpleLayout>
  )
}

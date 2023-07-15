import { SimpleLayout } from "@/app/(common)/SimpleLayout"

import CheckoutForm from "./CheckoutForm"

export default function CheckoutPage() {
  return (
    <SimpleLayout
      title="Checkout Demo"
      intro="LINE pay integration with mocked product info for demonstration purpose"
    >
      <CheckoutForm />
    </SimpleLayout>
  )
}

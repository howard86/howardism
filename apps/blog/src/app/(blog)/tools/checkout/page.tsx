import { SimpleLayout } from "@/app/(common)/SimpleLayout"
import prisma from "@/services/prisma"
import { normalize } from "@/utils/array"

import CheckoutForm from "./CheckoutForm"
import { DEFAULT_SHIPPING_COST } from "./constants"

export default async function CheckoutPage() {
  const products = await prisma.commerceProduct.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      color: true,
      size: true,
      imageUrl: true,
      imageAlt: true,
    },
  })

  return (
    <SimpleLayout
      title="Checkout Demo"
      intro="LINE pay integration with mocked product info for demonstration purpose"
    >
      <CheckoutForm products={normalize(products)} shippingCost={DEFAULT_SHIPPING_COST} />
    </SimpleLayout>
  )
}

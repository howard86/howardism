import { BadRequestException, RouterBuilder } from "next-api-handler"

import { DEFAULT_SHIPPING_COST, DEFAULT_TAX_RATE } from "@/app/(blog)/tools/checkout/CheckoutForm"
import { checkoutSchema } from "@/app/(blog)/tools/checkout/schema"
import prisma from "@/services/prisma"

const router = new RouterBuilder()

const normalize = <T extends { id: string }>(items: T[]) => {
  const ids: string[] = []
  const entities: NodeJS.Dict<T> = {}

  for (const item of items) {
    ids.push(item.id)
    entities[item.id] = item
  }

  return {
    ids,
    entities,
  }
}

router.post(async (req) => {
  const input = checkoutSchema.safeParse(req.body)

  if (!input.success) throw new BadRequestException(input.error.message)

  const products = await prisma.commerceProduct.findMany({
    where: {
      id: {
        in: input.data.items.map((product) => product.id),
      },
    },
  })

  if (products.length !== input.data.items.length)
    throw new BadRequestException("Invalid product ids")

  const { entities } = normalize(products)

  const productPriceSum = input.data.items.reduce((sum, item) => {
    const product = entities[item.id]

    return product ? sum + product.price * item.quantity : sum
  }, 0)

  const total = productPriceSum + productPriceSum * DEFAULT_TAX_RATE + DEFAULT_SHIPPING_COST

  const order = await prisma.commerceOrder.create({
    data: {
      email: input.data.email,
      name: input.data.name,
      status: "pending",
      totalPrice: Math.round(total * 100) / 100,
      products: {
        create: input.data.items.map((product) => ({
          product: {
            connect: {
              id: product.id,
            },
          },
          quantity: product.quantity,
        })),
      },
    },
  })

  // TODO: add transaction & payment integration

  return order
})

export default router.build()

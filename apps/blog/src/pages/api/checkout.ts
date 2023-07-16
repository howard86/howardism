import { BadRequestException, RouterBuilder } from "next-api-handler"
import { z } from "zod"

import { DEFAULT_SHIPPING_COST, DEFAULT_TAX_RATE } from "@/app/(blog)/tools/checkout/CheckoutForm"
import { checkoutSchema } from "@/app/(blog)/tools/checkout/schema"
import { env } from "@/config/env.mjs"
import {
  confirmApi,
  ConfirmApiReturnCode,
  requestApi,
  RequestApiReturnCode,
} from "@/services/line-pay"
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

enum CallbackApiType {
  Confirm,
  Cancel,
}

const callbackSchema = z.object({
  orderId: z.string(),
  transactionId: z.number(),
  type: z.nativeEnum(CallbackApiType),
})

router
  .get(async (req, res) => {
    const input = callbackSchema.safeParse(req.query)

    if (!input.success) throw new BadRequestException(input.error.message)

    switch (input.data.type) {
      case CallbackApiType.Confirm: {
        const order = await prisma.commerceOrder.update({
          where: {
            id: input.data.orderId,
          },
          data: {
            status: "confirmed",
            transactions: {
              update: {
                where: {
                  channelId: input.data.transactionId,
                },
                data: {
                  status: "confirmed",
                },
              },
            },
          },
        })

        const linePayResponse = await confirmApi(input.data.transactionId, {
          amount: order.totalPrice,
          currency: "USD",
        })

        console.debug(`linePayConfirmResponse`, linePayResponse)

        // TODO: handle more return codes
        const isSuccess = linePayResponse.returnCode === ConfirmApiReturnCode.Success

        await prisma.commerceTransaction.update({
          where: {
            channelId: input.data.transactionId,
          },
          data: {
            status: isSuccess ? "success" : "failed-to-confirm",
          },
        })

        res.redirect(
          isSuccess
            ? `/tools/checkout/success?orderId=${order.id}`
            : `/tools/checkout/cancelled?orderId=${order.id}`
        )

        break
      }

      case CallbackApiType.Cancel: {
        const order = await prisma.commerceOrder.update({
          where: {
            id: input.data.orderId,
          },
          data: {
            status: "cancelled",
            transactions: {
              update: {
                where: {
                  channelId: input.data.transactionId,
                },
                data: {
                  status: "cancelled",
                },
              },
            },
          },
        })

        res.redirect(`/tools/checkout/cancelled?orderId=${order.id}`)
        break
      }

      default:
        throw new Error(`Invalid callback type: ${input.data.type}`)
    }
  })
  .post(async (req, res) => {
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

    const total =
      Math.round(
        (productPriceSum + productPriceSum * DEFAULT_TAX_RATE + DEFAULT_SHIPPING_COST) * 100
      ) / 100

    const order = await prisma.commerceOrder.create({
      data: {
        email: input.data.email,
        name: input.data.name,
        status: "pending",
        totalPrice: total,
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

    const linePayResponse = await requestApi({
      amount: total,
      currency: "USD",
      orderId: order.id,
      packages: [
        {
          id: order.id,
          amount: total,
          products: input.data.items.map((item) => {
            const product = entities[item.id]

            if (!product) throw new Error(`Product not found by id=${item.id}`)

            return {
              id: item.id,
              name: product.title,
              imageUrl: product.imageUrl,
              price: product.price,
              quantity: item.quantity,
            }
          }),
        },
      ],
      redirectUrls: {
        confirmUrl: `${env.NEXTAUTH_URL}/api/checkout?type=confirm`,
        cancelUrl: `${env.NEXTAUTH_URL}/api/checkout?type=cancel`,
      },
      options: {
        display: {
          locale: "zh_TW",
        },
      },
    })

    console.debug(`linePayRequestResponse`, linePayResponse)

    // TODO: handle more return codes
    const isSuccess = linePayResponse.returnCode === RequestApiReturnCode.Success

    await prisma.commerceTransaction.create({
      data: {
        amount: total,
        currency: "USD",
        status: isSuccess ? "pending" : "failed-to-request",
        channelId: linePayResponse.info.transactionId,
        order: {
          connect: {
            id: order.id,
          },
        },
      },
    })

    if (!isSuccess) throw new Error(`Line Pay request failed: ${linePayResponse.returnMessage}`)

    // TODO: add user agent parser to determine redirect url
    res.redirect(linePayResponse.info.paymentUrl.web)
  })

export default router.build()

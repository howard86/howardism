import { BadRequestException, RouterBuilder } from "next-api-handler"
import parser from "ua-parser-js"
import { z } from "zod"

import { DEFAULT_TAX_RATE } from "@/app/(blog)/tools/checkout/CheckoutForm"
import { DEFAULT_SHIPPING_COST } from "@/app/(blog)/tools/checkout/constants"
import { checkoutSchema } from "@/app/(blog)/tools/checkout/schema"
import { env } from "@/config/env.mjs"
import {
  confirmApi,
  ConfirmApiReturnCode,
  requestApi,
  RequestApiReturnCode,
} from "@/services/line-pay"
import prisma from "@/services/prisma"
import { normalize } from "@/utils/array"

const router = new RouterBuilder()

enum CallbackApiType {
  Confirm = "confirm",
  Cancel = "cancel",
}

const callbackSchema = z.object({
  orderId: z.string(),
  transactionId: z.string(),
  internalId: z.string(),
  type: z.nativeEnum(CallbackApiType),
})

router
  .get(async (req, res) => {
    const input = callbackSchema.safeParse(req.query)

    if (!input.success) throw new BadRequestException(input.error.message)

    switch (input.data.type) {
      case CallbackApiType.Confirm: {
        // FIXME: line transactionId is different from the Id sent from confirmApi
        const order = await prisma.commerceOrder.update({
          where: {
            id: input.data.orderId,
          },
          data: {
            status: "confirmed",
            transactions: {
              update: {
                where: {
                  id: input.data.internalId,
                },
                data: {
                  status: "confirmed",
                },
              },
            },
          },
        })

        // FIXME: line transactionId somehow is different from the Id sent from confirmApi
        const linePayResponse = await confirmApi(input.data.transactionId, {
          amount: order.totalPrice,
          currency: "TWD",
        })

        console.debug(`linePayConfirmResponse`, linePayResponse)

        // TODO: handle more return codes
        const isSuccess = linePayResponse.returnCode === ConfirmApiReturnCode.Success

        await prisma.commerceTransaction.update({
          where: {
            id: input.data.internalId,
          },
          data: {
            status: isSuccess ? "success" : "failed-to-confirm",
          },
        })

        if (isSuccess) {
          await res.revalidate(`/tools/checkout/${order.id}`).catch(console.error)
        }

        res.redirect(
          isSuccess
            ? `/tools/checkout/${order.id}`
            : `/tools/checkout/cancelled?orderId=${order.id}`
        )

        return
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
                  id: input.data.internalId,
                },
                data: {
                  status: "cancelled",
                },
              },
            },
          },
        })

        res.redirect(`/tools/checkout/cancelled?orderId=${order.id}`)
        return
      }

      default:
        throw new Error(`Invalid callback type: ${input.data.type}`)
    }
  })
  .post(async (req) => {
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

    const tax = Math.round(productPriceSum * DEFAULT_TAX_RATE)
    const total = productPriceSum + tax + DEFAULT_SHIPPING_COST

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
        transactions: {
          create: {
            amount: total,
            currency: "TWD",
            status: "initiated",
          },
        },
      },
      select: {
        id: true,
        transactions: {
          select: {
            id: true,
          },
        },
      },
    })

    const internalId = order.transactions[0].id

    const linePayResponse = await requestApi({
      amount: total,
      currency: "TWD",
      orderId: order.id,
      packages: [
        {
          id: order.id,
          amount: productPriceSum,
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
        {
          id: "tax",
          amount: tax,
          products: [
            {
              id: "tax",
              name: `${DEFAULT_TAX_RATE * 100}% Tax`,
              price: tax,
              quantity: 1,
            },
          ],
        },
        {
          id: "shipping",
          amount: DEFAULT_SHIPPING_COST,
          products: [
            {
              id: "shipping",
              name: "Shipping",
              price: DEFAULT_SHIPPING_COST,
              quantity: 1,
            },
          ],
        },
      ],
      redirectUrls: {
        confirmUrl: `${env.NEXT_PUBLIC_VERCEL_URL}/api/checkout?type=${CallbackApiType.Confirm}&internalId=${internalId}`,
        cancelUrl: `${env.NEXT_PUBLIC_VERCEL_URL}/api/checkout?type=${CallbackApiType.Cancel}&internalId=${internalId}`,
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

    await prisma.commerceTransaction.update({
      where: {
        id: internalId,
      },
      data: {
        status: isSuccess ? "pending" : "failed-to-request",
        channelId: BigInt(linePayResponse.info.transactionId).toString(),
      },
    })

    if (!isSuccess) throw new Error(`Line Pay request failed: ${linePayResponse.returnMessage}`)

    const ua = parser(req.headers["user-agent"])

    return ua.device.type === "mobile"
      ? linePayResponse.info.paymentUrl.app
      : linePayResponse.info.paymentUrl.web
  })

export default router.build()

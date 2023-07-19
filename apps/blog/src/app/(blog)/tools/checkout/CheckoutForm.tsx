"use client"

import { TrashIcon } from "@heroicons/react/24/outline"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { ApiResponse } from "next-api-handler"
import { useForm } from "react-hook-form"

import FormInput from "@/app/(common)/FormInput"
import FormSelect from "@/app/(common)/FormSelect"
import type { Normalized } from "@/utils/array"

import ProductOption from "./ProductOption"
import { CheckoutSchema, checkoutSchema } from "./schema"
import { numberFormat } from "./utils"

export const DEFAULT_TAX_RATE = 0.08

interface ECommerceProduct {
  id: string
  title: string
  price: number
  color: string
  size: string
  imageUrl: string
  imageAlt: string
}

enum ItemQuantityMap {
  clk496ee1000008jia9426s1z = 2,
  clk49c27f000108ji35fm5crr = 1,
  clk49c86t000208ji9prlh4b1 = 4,
}

interface CheckoutFormProps {
  shippingCost: number
  products: Normalized<ECommerceProduct>
}

export default function CheckoutForm({ products, shippingCost }: CheckoutFormProps) {
  const { watch, register, formState, setValue, handleSubmit } = useForm<CheckoutSchema>({
    mode: "onBlur",
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      items: products.ids.map((id) => ({
        id,
        quantity: ItemQuantityMap[id],
      })),
    },
  })

  const items = watch("items") || []
  const partialSum = items.reduce((prev, cur) => {
    const product = products.entities[cur.id]

    if (!product) return prev

    return prev + product.price * cur.quantity
  }, 0)

  // TODO: redirect to correct page base on checkout result
  const handleCheckout = handleSubmit(async (data) => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = (await response.json()) as ApiResponse<string>

    if (!result.success) {
      throw new Error(result.message)
    } else if (result.data) {
      window.location.href = result.data
    }
  }, console.error)

  return (
    <div className="rounded-xl border bg-base-100 shadow-sm">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Checkout</h2>

        <form className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16" onSubmit={handleCheckout}>
          <div>
            <h2 className="text-lg font-medium">Contact information</h2>

            <div className="mt-8 space-y-8">
              <FormInput register={register} name="name" label="Name" errors={formState.errors} />
              <FormInput
                register={register}
                name="email"
                label="Email address"
                errors={formState.errors}
              />
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <h2 className="text-lg font-medium">Order summary</h2>

            <div className="mt-4 rounded-lg border bg-base-100 shadow-sm">
              <h3 className="sr-only">Items in your cart</h3>
              <ul className="divide-y divide-gray-200">
                {items.map((item, index) => {
                  const product = products.entities[item.id]

                  if (!product) return null

                  const handleRemove = () => {
                    setValue(
                      "items",
                      items.filter((raw) => raw.id !== item.id),
                      { shouldDirty: true }
                    )
                  }

                  return (
                    <li key={item.id} className="flex px-4 py-6 sm:px-6">
                      <div className="flex-shrink-0">
                        <Image
                          src={product.imageUrl}
                          alt={product.imageAlt}
                          width={80}
                          height={80}
                          className="h-auto w-20 rounded-md"
                        />
                      </div>

                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex">
                          <div className="min-w-0 flex-1 text-sm">
                            <h4 className="font-medium">{product.title}</h4>
                            <p className="mt-1 text-sm text-neutral-content">{product.color}</p>
                            <p className="mt-1 text-sm text-neutral-content">{product.size}</p>
                          </div>

                          <div className="ml-4 flow-root flex-shrink-0">
                            <button
                              type="button"
                              className="btn-sm btn-circle btn -m-2.5"
                              disabled={items.length === 1}
                              onClick={handleRemove}
                            >
                              <span className="sr-only">Remove</span>
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-1 items-end justify-between pt-2">
                          <p className="mt-1 text-sm font-medium">
                            {numberFormat.format(product.price)}
                          </p>

                          <FormSelect
                            register={register}
                            name={`items.${index}.quantity`}
                            errors={formState.errors}
                            className="-m-2.5"
                            label="Quantity"
                          >
                            <ProductOption min={1} max={8} />
                          </FormSelect>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <dl className="space-y-6 border-t px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Subtotal</dt>
                  <dd className="text-sm font-medium">{numberFormat.format(partialSum)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Shipping</dt>
                  <dd className="text-sm font-medium">{numberFormat.format(shippingCost)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Taxes</dt>
                  <dd className="text-sm font-medium">
                    {numberFormat.format(partialSum * DEFAULT_TAX_RATE)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t pt-6">
                  <dt className="text-base font-medium">Total</dt>
                  <dd className="text-base font-medium">
                    {numberFormat.format(partialSum + shippingCost + partialSum * DEFAULT_TAX_RATE)}
                  </dd>
                </div>
              </dl>

              <div className="border-t px-4 py-6 sm:px-6">
                <button type="submit" className="btn-primary btn w-full">
                  {formState.isSubmitting && <span className="loading loading-spinner" />}
                  Confirm order
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@howardism/ui/components/button";
import Image from "next/image";
import type { ApiResponse } from "next-api-handler";
import { useForm } from "react-hook-form";

import FormInput from "@/app/(common)/FormInput";
import FormSelect from "@/app/(common)/FormSelect";
import type { Normalized } from "@/utils/array";

import ProductOption from "./ProductOption";
import { type CheckoutSchema, checkoutSchema } from "./schema";
import { numberFormat } from "./utils";

export const DEFAULT_TAX_RATE = 0.08;

interface ECommerceProduct {
  color: string;
  id: string;
  imageAlt: string;
  imageUrl: string;
  price: number;
  size: string;
  title: string;
}

const ItemQuantityMap: Record<string, number> = {
  clk496ee1000008jia9426s1z: 2,
  clk49c27f000108ji35fm5crr: 1,
  clk49c86t000208ji9prlh4b1: 4,
};

interface CheckoutFormProps {
  products: Normalized<ECommerceProduct>;
  shippingCost: number;
}

export default function CheckoutForm({
  products,
  shippingCost,
}: CheckoutFormProps) {
  const { watch, register, formState, setValue, handleSubmit } =
    useForm<CheckoutSchema>({
      mode: "onBlur",
      resolver: zodResolver(checkoutSchema),
      defaultValues: {
        items: products.ids.map((id) => ({
          id,
          quantity: ItemQuantityMap[id],
        })),
      },
    });

  const items = watch("items") || [];
  const partialSum = items.reduce((prev, cur) => {
    const product = products.entities[cur.id];

    if (!product) {
      return prev;
    }

    return prev + product.price * cur.quantity;
  }, 0);

  // TODO: redirect to correct page base on checkout result
  const handleCheckout = handleSubmit(async (data) => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = (await response.json()) as ApiResponse<string>;

    if (!result.success) {
      throw new Error(result.message);
    }
    if (result.data) {
      window.location.href = result.data;
    }
  }, console.error);

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Checkout</h2>

        <form
          className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16"
          onSubmit={handleCheckout}
        >
          <div>
            <h2 className="font-medium text-lg">Contact information</h2>

            <div className="mt-8 space-y-8">
              <FormInput
                errors={formState.errors}
                label="Name"
                name="name"
                register={register}
              />
              <FormInput
                errors={formState.errors}
                label="Email address"
                name="email"
                register={register}
              />
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <h2 className="font-medium text-lg">Order summary</h2>

            <div className="mt-4 rounded-lg border bg-background shadow-sm">
              <h3 className="sr-only">Items in your cart</h3>
              <ul className="divide-y divide-gray-200">
                {items.map((item, index) => {
                  const product = products.entities[item.id];

                  if (!product) {
                    return null;
                  }

                  const handleRemove = () => {
                    setValue(
                      "items",
                      items.filter((raw) => raw.id !== item.id),
                      { shouldDirty: true }
                    );
                  };

                  return (
                    <li className="flex px-4 py-6 sm:px-6" key={item.id}>
                      <div className="flex-shrink-0">
                        <Image
                          alt={product.imageAlt}
                          className="h-auto w-20 rounded-md"
                          height={80}
                          src={product.imageUrl}
                          width={80}
                        />
                      </div>

                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex">
                          <div className="min-w-0 flex-1 text-sm">
                            <h4 className="font-medium">{product.title}</h4>
                            <p className="mt-1 text-muted-foreground text-sm">
                              {product.color}
                            </p>
                            <p className="mt-1 text-muted-foreground text-sm">
                              {product.size}
                            </p>
                          </div>

                          <div className="ml-4 flow-root flex-shrink-0">
                            <Button
                              className="-m-2.5"
                              disabled={items.length === 1}
                              onClick={handleRemove}
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              <span className="sr-only">Remove</span>
                              <TrashIcon
                                aria-hidden="true"
                                className="h-5 w-5"
                              />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-1 items-end justify-between pt-2">
                          <p className="mt-1 font-medium text-sm">
                            {numberFormat.format(product.price)}
                          </p>

                          <FormSelect
                            className="-m-2.5"
                            errors={formState.errors}
                            label="Quantity"
                            name={`items.${index}.quantity`}
                            register={register}
                          >
                            <ProductOption max={8} min={1} />
                          </FormSelect>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <dl className="space-y-6 border-t px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Subtotal</dt>
                  <dd className="font-medium text-sm">
                    {numberFormat.format(partialSum)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Shipping</dt>
                  <dd className="font-medium text-sm">
                    {numberFormat.format(shippingCost)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Taxes</dt>
                  <dd className="font-medium text-sm">
                    {numberFormat.format(partialSum * DEFAULT_TAX_RATE)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t pt-6">
                  <dt className="font-medium text-base">Total</dt>
                  <dd className="font-medium text-base">
                    {numberFormat.format(
                      partialSum + shippingCost + partialSum * DEFAULT_TAX_RATE
                    )}
                  </dd>
                </div>
              </dl>

              <div className="border-t px-4 py-6 sm:px-6">
                <Button className="w-full" type="submit">
                  {formState.isSubmitting && (
                    <span className="loading loading-spinner" />
                  )}
                  Confirm order
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

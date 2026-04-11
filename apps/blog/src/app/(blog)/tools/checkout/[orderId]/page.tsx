import Image from "next/image";
import { notFound } from "next/navigation";

import { SimpleLayout } from "@/app/(common)/SimpleLayout";
import prisma from "@/services/prisma";

import { DEFAULT_SHIPPING_COST } from "../constants";
import { numberFormat } from "../utils";

export interface OrderPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  const order = await prisma.commerceOrder.findUnique({
    where: {
      id: orderId,
    },
    select: {
      email: true,
      name: true,
      totalPrice: true,
      transactions: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          status: true,
        },
      },
      products: {
        select: {
          quantity: true,
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              color: true,
              size: true,
              imageUrl: true,
              imageAlt: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return notFound();
  }

  const shortenedOrderId = orderId.slice(0, 6);

  const subTotal = order.products.reduce(
    (sum, cur) => sum + cur.product.price * cur.quantity,
    0
  );

  return (
    <SimpleLayout
      intro={`Your order #${shortenedOrderId} has shipped and will be with you soon.`}
      title="Thank you!"
    >
      <section
        aria-labelledby="order-heading"
        className="mt-10 border-border border-t"
      >
        <h2 className="sr-only" id="order-heading">
          Your order
        </h2>

        <h3 className="sr-only">Items</h3>
        <div className="mb-8">
          {order.products.map(({ product, quantity }) => (
            <div
              className="flex space-x-6 border-border border-b py-10"
              key={product.id}
            >
              <Image
                alt={product.imageAlt}
                className="h-20 w-20 flex-none rounded-lg bg-background object-cover object-center sm:h-40 sm:w-40"
                height={160}
                src={product.imageUrl}
                width={160}
              />
              <div className="flex flex-auto flex-col">
                <div>
                  <h4 className="font-medium">{product.title}</h4>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {product.color} · {product.size}
                  </p>
                </div>
                <div className="mt-6 flex flex-1 items-end">
                  <dl className="flex space-x-4 divide-x divide-border text-sm sm:space-x-6">
                    <div className="flex">
                      <dt className="font-medium">Quantity</dt>
                      <dd className="ml-2 text-muted-foreground">{quantity}</dd>
                    </div>
                    <div className="flex pl-4 sm:pl-6">
                      <dt className="font-medium">Price</dt>
                      <dd className="ml-2">
                        {numberFormat.format(product.price)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:ml-40 sm:pl-6">
          <h3 className="sr-only">Your information</h3>

          <h4 className="sr-only">Payment</h4>
          <dl className="grid grid-cols-2 gap-x-6 border-border py-10 text-sm">
            <div>
              <dt className="font-medium">Payment method</dt>
              <dd className="mt-2 text-muted-foreground">
                <p>LINE Pay</p>
              </dd>
            </div>
            <div>
              <dt className="font-medium">Contact Information</dt>
              <dd className="mt-2 text-muted-foreground">
                <p>{order.name}</p>
                <p>{order.email}</p>
              </dd>
            </div>
          </dl>

          <h3 className="sr-only">Summary</h3>

          <dl className="space-y-6 border-border border-t pt-10 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium">Subtotal</dt>
              <dd className="text-muted-foreground">
                {numberFormat.format(subTotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Shipping</dt>
              <dd className="text-muted-foreground">
                {numberFormat.format(DEFAULT_SHIPPING_COST)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Tax</dt>
              <dd className="text-muted-foreground">
                {numberFormat.format(
                  order.totalPrice - DEFAULT_SHIPPING_COST - subTotal
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Total</dt>
              <dd>{numberFormat.format(order.totalPrice)}</dd>
            </div>
          </dl>
        </div>
      </section>
    </SimpleLayout>
  );
}

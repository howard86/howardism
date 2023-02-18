import type { Prisma } from "@prisma/client"

export const generateArrayStrings = (items: Prisma.JsonValue) =>
  Array.isArray(items) ? items.join("\n") : ""

export const generateLoremIpsum = (length?: number) =>
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin hendrerit congue quam, euismod hendrerit ante euismod ut. Donec eget massa tempor, semper velit in, elementum lacus. Morbi molestie vulputate augue a tempor. Sed scelerisque eget ligula at luctus. Curabitur facilisis imperdiet arcu et lobortis. Donec lacinia rutrum elit, in pharetra tellus vehicula id. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Aliquam erat volutpat. Maecenas consequat ex sed lacus ornare congue. Suspendisse potenti. Etiam porta at quam sit amet molestie.".slice(
    0,
    length
  )

export const generateLoremIpsumArray = (...args: number[]) =>
  generateArrayStrings(args.map(generateLoremIpsum))

export const generateDateISOString = (date: Date | null) =>
  date ? date.toISOString().substring(0, 10) : ""

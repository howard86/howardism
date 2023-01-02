import { BadRequestException, RouterBuilder } from "next-api-handler"

import { subscribeToNewsletter } from "@/services/mail"

// From zod validation: https://github.com/colinhacks/zod/blob/6252c757f8978da733485d120f77314bc1724ead/deno/lib/types.ts#L521
const emailRegex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i

const router = new RouterBuilder()

router.post(async (req, res) => {
  const { email } = req.body

  if (typeof email !== "string")
    throw new BadRequestException(`Incorrect email in body, req.body=${JSON.stringify(req.body)}`)

  if (!emailRegex.test(email))
    throw new BadRequestException(`Incorrect email format, given=${email}`)

  await subscribeToNewsletter(email)

  res.redirect("/thank-you")
})

export default router.build()

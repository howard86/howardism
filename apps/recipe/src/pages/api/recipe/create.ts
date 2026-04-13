import type { NextApiRequest, NextApiResponse } from "next";

import { createRecipe } from "@/services/recipe";
import { bearerTokenSchema, recipeSchema } from "./schemas";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authResult = bearerTokenSchema.safeParse(req.headers.authorization);

  if (!authResult.success) {
    return res.status(401).send({ success: false });
  }

  const bodyResult = recipeSchema.safeParse(req.body);

  if (!bodyResult.success) {
    return res.status(400).send({ errors: bodyResult.error.flatten() });
  }

  try {
    const success = await createRecipe(bodyResult.data, authResult.data);
    return res.status(200).send({ success });
  } catch (error) {
    console.error((error as Error).message);
    return res.status(403).send({ success: false });
  }
};

export default handler;

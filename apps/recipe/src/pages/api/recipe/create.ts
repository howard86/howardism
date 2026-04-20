import type { NextApiRequest, NextApiResponse } from "next";

import { createRecipe } from "@/services/recipe";
import { getAuthToken } from "../_lib/auth-cookie";
import { recipeSchema } from "./schemas";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const jwt = getAuthToken(req);

  if (jwt === null) {
    return res.status(401).send({ success: false });
  }

  const bodyResult = recipeSchema.safeParse(req.body);

  if (!bodyResult.success) {
    return res.status(400).send({ errors: bodyResult.error.flatten() });
  }

  try {
    const success = await createRecipe(bodyResult.data, jwt);
    return res.status(200).send({ success });
  } catch (error) {
    console.error((error as Error).message);
    return res.status(403).send({ success: false });
  }
};

export default handler;

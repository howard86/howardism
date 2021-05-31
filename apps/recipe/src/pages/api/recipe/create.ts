import type { NextApiRequest, NextApiResponse } from "next";
import { createRecipe } from "@/services/recipe";

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const recipe = req.body;
  console.warn("Incoming recipe:", recipe);
  const { authorization } = req.headers;

  // Start with 'Bearer ...'
  if (typeof authorization !== "string" || authorization.length < 8) {
    console.error(authorization);
    return res.status(400).send({ success: false });
  }

  try {
    const success = await createRecipe(recipe, authorization);
    return res.status(200).send({ success });
  } catch (error) {
    console.error(error);
    return res.status(403).send({ success: false });
  }
};

export default handler;

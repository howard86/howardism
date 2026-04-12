import type { NextApiRequest, NextApiResponse } from "next";

import { login } from "@/services/auth";
import { loginSchema } from "../recipe/schemas";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).send({ errors: result.error.flatten() });
  }

  try {
    const jwt = await login(result.data);
    return res.status(200).send({ success: true, jwt });
  } catch (error) {
    console.error((error as Error).message);
    return res.status(400).send({ success: false });
  }
};

export default handler;

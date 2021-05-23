import type { NextApiRequest, NextApiResponse } from "next";
import { login } from "@/services/auth";

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const account = req.body;

  try {
    const jwt = await login(account);
    return res.status(200).send({ success: true, jwt });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ success: false });
  }
};

export default handler;

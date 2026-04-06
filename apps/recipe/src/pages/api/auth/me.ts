import type { NextApiRequest, NextApiResponse } from "next";

import { verify } from "@/services/auth";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const jwt = req.headers["recipe-token"];

  if (typeof jwt !== "string") {
    return res.status(400).send({ success: false });
  }

  try {
    const account = await verify(jwt);
    return res.status(200).send({ success: true, account });
  } catch (error) {
    console.error(error);
    return res.status(403).send({ success: false });
  }
};

export default handler;

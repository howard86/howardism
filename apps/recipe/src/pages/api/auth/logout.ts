import type { NextApiRequest, NextApiResponse } from "next";

import { serializeClearAuthCookie } from "../_lib/auth-cookie";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  res.setHeader("Set-Cookie", serializeClearAuthCookie());
  return res.status(200).send({ success: true });
};

export default handler;

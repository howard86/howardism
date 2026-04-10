import type { NextApiRequest, NextApiResponse } from "next";

import { GITHUB_ENDPOINT } from "@/constants/github";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = process.env.GITHUB_ACCESS_TOKEN;

  if (!token) {
    return res.status(500).json({ message: "GitHub token not configured" });
  }

  const response = await fetch(GITHUB_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();

  return res.status(response.status).json(data);
};

export default handler;

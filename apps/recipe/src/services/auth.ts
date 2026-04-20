import type { Account, VerifyResponse } from "@/types/auth";

import cms from "./cms";

interface CmsLoginResponse {
  jwt: string;
}

export const login = async (account: Account): Promise<string> => {
  const response = await cms.post<CmsLoginResponse>("/auth/local", account);

  return response.data.jwt;
};

export const verify = async (jwt: string): Promise<VerifyResponse> => {
  const response = await cms.get<VerifyResponse>("/users/me", {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  // TODO: we only need these fields for client
  const { id, email, username } = response.data;

  return { id, email, username };
};

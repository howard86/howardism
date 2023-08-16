import { PrismaAdapter } from "@next-auth/prisma-adapter"
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

import { env } from "@/config/env.mjs"
import prisma from "@/services/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers:
    env.VERCEL_ENV === "preview"
      ? [
          CredentialsProvider({
            name: "Credentials",
            credentials: {
              username: { label: "Username", type: "text", placeholder: "jsmith" },
              password: { label: "Password", type: "password" },
            },
            authorize: () => ({
              id: "TEST",
              name: "Howard Tai",
              email: "howard+test@howardism.dev",
              image: "https://avatars.githubusercontent.com/u/42728066?v=4",
            }),
          }),
        ]
      : [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
          GitHubProvider({
            clientId: env.GITHUB_ID,
            clientSecret: env.GITHUB_SECRET,
          }),
        ],
  session: { strategy: "jwt" },
}

export default NextAuth(authOptions)

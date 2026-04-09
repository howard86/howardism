"use client";

import { Button } from "@howardism/ui/components/button";
import { Input } from "@howardism/ui/components/input";
import { Label } from "@howardism/ui/components/label";
import { type FormEvent, useState } from "react";

import { Container } from "@/app/(common)/Container";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSocialSignIn = (provider: "github" | "google") => {
    authClient.signIn.social({ provider, callbackURL: "/profile" });
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/profile",
    });
    if (result.error) {
      setError(result.error.message ?? "Sign in failed");
    }
  };

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <div className="mx-auto max-w-sm space-y-6">
        <h1 className="font-bold text-2xl">Sign in</h1>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => handleSocialSignIn("google")}
            type="button"
          >
            Continue with Google
          </Button>
          <Button
            className="w-full"
            onClick={() => handleSocialSignIn("github")}
            type="button"
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleEmailSignIn}>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>
      </div>
    </Container>
  );
}

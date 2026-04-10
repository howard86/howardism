"use client";

import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid";
import { Button } from "@howardism/ui/components/button";

import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const handleSignOut = () =>
    authClient.signOut({
      fetchOptions: { onSuccess: () => window.location.replace("/login") },
    });

  return (
    <Button onClick={handleSignOut} type="button">
      <ArrowRightOnRectangleIcon aria-hidden="true" className="h-5 w-5" />
      <span>Logout</span>
    </Button>
  );
}

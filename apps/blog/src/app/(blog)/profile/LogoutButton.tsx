"use client";

import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleSignOut = () => signOut();

  return (
    <button className="btn-brand btn" onClick={handleSignOut} type="button">
      <ArrowRightOnRectangleIcon aria-hidden="true" className="h-5 w-5" />
      <span>Logout</span>
    </button>
  );
}

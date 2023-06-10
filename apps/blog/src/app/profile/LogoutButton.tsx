"use client"

import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid"
import { signOut } from "next-auth/react"

export default function LogoutButton() {
  const handleSignOut = () => signOut()

  return (
    <button type="button" className="btn-primary btn-outline btn" onClick={handleSignOut}>
      <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
      <span>Logout</span>
    </button>
  )
}

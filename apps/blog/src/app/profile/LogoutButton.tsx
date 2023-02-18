"use client"

import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid"
import { signOut } from "next-auth/react"

export default function LogoutButton() {
  const handleSignOut = () => signOut()

  return (
    <button type="button" className="button" onClick={handleSignOut}>
      <ArrowRightOnRectangleIcon className="-ml-1 mr-2 h-5 w-5 text-zinc-400" aria-hidden="true" />
      <span>Logout</span>
    </button>
  )
}

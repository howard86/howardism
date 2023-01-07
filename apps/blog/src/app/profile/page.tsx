import { EnvelopeIcon } from "@heroicons/react/20/solid"
import Image from "next/image"
import { redirect } from "next/navigation"
import { unstable_getServerSession } from "next-auth/next"

import { Container } from "@/components/template/Container"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

import LogoutButton from "./LogoutButton"

interface InfoFieldProps {
  title: string
  description: string | null | undefined
}

const BACKGROUND_IMAGE_URL =
  "https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"

// flex rounded-full bg-white/90 px-3 text-sm font-medium text-zinc-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10
function InfoField({ title, description }: InfoFieldProps) {
  return (
    <div className="sm:col-span-1">
      <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</dt>
      <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">{description || "-"}</dd>
    </div>
  )
}

export default async function ProfilePage() {
  const session = await unstable_getServerSession(authOptions)

  if (!session) redirect("/")

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <article className="relative z-0 overflow-y-auto focus:outline-none">
        <div>
          <Image
            className="h-32 w-full overflow-hidden rounded-t-lg object-cover lg:h-48"
            src={BACKGROUND_IMAGE_URL}
            width={900}
            height={600}
            alt="background image"
          />
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-8 sm:-mt-12 sm:flex sm:items-end sm:space-x-5">
              {session?.user?.image && (
                <Image
                  className="h-16 w-16 rounded-full ring-4 ring-white sm:h-24 sm:w-24"
                  src={session?.user?.image}
                  width={96}
                  height={96}
                  alt={`${session?.user?.name || "user"} profile`}
                />
              )}
              <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                <div className="mt-6 min-w-0 flex-1 sm:hidden 2xl:block">
                  <h1 className="truncate text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                    {session?.user?.name}
                  </h1>
                </div>
                <div className="justify-stretch mt-6 flex flex-col space-y-3 sm:translate-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <button type="button" className="button">
                    <EnvelopeIcon className="-ml-1 mr-2 h-5 w-5 text-zinc-400" aria-hidden="true" />
                    <span>Message</span>
                  </button>
                  <LogoutButton />
                </div>
              </div>
            </div>
            <div className="mt-6 hidden min-w-0 flex-1 sm:block 2xl:hidden">
              <h1 className="truncate text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                {session?.user?.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <InfoField title="Name" description={session?.user?.name} />
            <InfoField title="Email" description={session?.user?.email} />
          </dl>
        </div>
      </article>
    </Container>
  )
}

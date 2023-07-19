import { UserPlusIcon } from "@heroicons/react/24/outline"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { cache } from "react"

import { Container } from "@/app/(common)/Container"
import { authOptions } from "@/pages/api/auth/[...nextauth]"
import prisma from "@/services/prisma"

import LogoutButton from "./LogoutButton"

interface InfoFieldProps {
  title: string
  description: string | null | undefined
}

const BACKGROUND_IMAGE_URL =
  "https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"

function InfoField({ title, description }: InfoFieldProps) {
  return (
    <div className="sm:col-span-1">
      <dt className="text-sm font-medium text-primary">{title}</dt>
      <dd className="mt-1 text-sm">{description || "-"}</dd>
    </div>
  )
}

const getResumeProfiles = cache(async (email: string) =>
  prisma.resumeProfile.findMany({
    where: { applicant: { email } },
  }),
)

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) redirect("/")

  const profiles = await getResumeProfiles(session.user.email)

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
              {session.user.image && (
                <Image
                  className="h-16 w-16 rounded-full ring-4 ring-white sm:h-24 sm:w-24"
                  src={session.user.image}
                  width={96}
                  height={96}
                  alt={`${session.user.name || "user"} profile`}
                />
              )}
              <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                <div className="mt-6 min-w-0 flex-1 sm:hidden 2xl:block">
                  <h1 className="truncate text-2xl font-bold">{session.user.name}</h1>
                </div>
                <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:translate-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link className="btn-brand btn" href="/profile/resume/add">
                    <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
                    <span>Add Resume</span>
                  </Link>

                  <LogoutButton />
                </div>
              </div>
            </div>
            <div className="mt-6 hidden min-w-0 flex-1 sm:block 2xl:hidden">
              <h1 className="truncate text-2xl font-bold">{session.user.name}</h1>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <InfoField title="Name" description={session.user.name} />
            <InfoField title="Email" description={session.user.email} />
          </dl>

          {profiles.length > 0 && (
            <div className="mb-2 mt-8 overflow-hidden bg-base-200/40 shadow ring-1 ring-base-content ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6"
                    >
                      Company
                    </th>
                    <th
                      scope="col"
                      className="hidden px-3 py-3.5 text-left text-sm font-semibold lg:table-cell"
                    >
                      Position
                    </th>
                    <th
                      scope="col"
                      className="hidden px-3 py-3.5 text-left text-sm font-semibold lg:table-cell"
                    >
                      Updated At
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium sm:w-auto sm:max-w-none sm:pl-6">
                        {profile.company}
                        <dl className="font-normal lg:hidden">
                          <dt className="sr-only">Position</dt>
                          <dd className="mt-1 truncate">{profile.position}</dd>
                          <dt className="sr-only">Updated At</dt>
                          <dd className="mt-1 truncate">
                            {profile.updatedAt.toLocaleDateString()}
                          </dd>
                        </dl>
                      </td>
                      <td className="hidden px-3 py-4 text-sm lg:table-cell ">
                        {profile.position}
                      </td>
                      <td className="hidden px-3 py-4 text-sm lg:table-cell">
                        {profile.updatedAt.toLocaleDateString()}
                      </td>
                      <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <dl className="inline-flex items-center justify-center gap-2">
                          <dt className="sr-only">View Resume</dt>
                          <dd>
                            <Link
                              href={`/profile/resume/${profile.id}`}
                              className="link-hover link-secondary link"
                            >
                              View
                            </Link>
                          </dd>
                          <dt className="sr-only">Edit Resume</dt>
                          <dd>
                            <Link
                              href={`/profile/resume/${profile.id}/edit`}
                              className="link-hover link-secondary link"
                            >
                              Edit
                            </Link>
                          </dd>
                          <dt className="sr-only">Clone Resume</dt>
                          <dd>
                            <Link
                              href={`/profile/resume/${profile.id}/clone`}
                              className="link-hover link-secondary link"
                            >
                              Clone
                            </Link>
                          </dd>
                        </dl>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>
    </Container>
  )
}

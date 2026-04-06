import { UserPlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { cache } from "react";

import { Container } from "@/app/(common)/Container";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/services/prisma";

import LogoutButton from "./LogoutButton";

interface InfoFieldProps {
  description: string | null | undefined;
  title: string;
}

const BACKGROUND_IMAGE_URL =
  "https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80";

function InfoField({ title, description }: InfoFieldProps) {
  return (
    <div className="sm:col-span-1">
      <dt className="font-medium text-primary text-sm">{title}</dt>
      <dd className="mt-1 text-sm">{description || "-"}</dd>
    </div>
  );
}

const getResumeProfiles = cache(async (email: string) =>
  prisma.resumeProfile.findMany({
    where: { applicant: { email } },
  })
);

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const profiles = await getResumeProfiles(session.user.email);

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <article className="relative z-0 overflow-y-auto focus:outline-none">
        <div>
          <Image
            alt="background image"
            className="h-32 w-full overflow-hidden rounded-t-lg object-cover lg:h-48"
            height={600}
            src={BACKGROUND_IMAGE_URL}
            width={900}
          />
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-8 sm:-mt-12 sm:flex sm:items-end sm:space-x-5">
              {session.user.image && (
                <Image
                  alt={`${session.user.name || "user"} profile`}
                  className="h-16 w-16 rounded-full ring-4 ring-white sm:h-24 sm:w-24"
                  height={96}
                  src={session.user.image}
                  width={96}
                />
              )}
              <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                <div className="mt-6 min-w-0 flex-1 sm:hidden 2xl:block">
                  <h1 className="truncate font-bold text-2xl">
                    {session.user.name}
                  </h1>
                </div>
                <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:translate-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link className="btn-brand btn" href="/profile/resume/add">
                    <UserPlusIcon aria-hidden="true" className="h-5 w-5" />
                    <span>Add Resume</span>
                  </Link>

                  <LogoutButton />
                </div>
              </div>
            </div>
            <div className="mt-6 hidden min-w-0 flex-1 sm:block 2xl:hidden">
              <h1 className="truncate font-bold text-2xl">
                {session.user.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <InfoField description={session.user.name} title="Name" />
            <InfoField description={session.user.email} title="Email" />
          </dl>

          {profiles.length > 0 && (
            <div className="mt-8 mb-2 overflow-hidden bg-base-200/40 shadow ring-1 ring-base-content ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y">
                <thead>
                  <tr>
                    <th
                      className="py-3.5 pr-3 pl-4 text-left font-semibold text-sm sm:pl-6"
                      scope="col"
                    >
                      Company
                    </th>
                    <th
                      className="hidden px-3 py-3.5 text-left font-semibold text-sm lg:table-cell"
                      scope="col"
                    >
                      Position
                    </th>
                    <th
                      className="hidden px-3 py-3.5 text-left font-semibold text-sm lg:table-cell"
                      scope="col"
                    >
                      Updated At
                    </th>
                    <th
                      className="relative py-3.5 pr-4 pl-3 sm:pr-6"
                      scope="col"
                    >
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="w-full max-w-0 py-4 pr-3 pl-4 font-medium text-sm sm:w-auto sm:max-w-none sm:pl-6">
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
                      <td className="hidden px-3 py-4 text-sm lg:table-cell">
                        {profile.position}
                      </td>
                      <td className="hidden px-3 py-4 text-sm lg:table-cell">
                        {profile.updatedAt.toLocaleDateString()}
                      </td>
                      <td className="py-4 pr-4 pl-3 text-right font-medium text-sm sm:pr-6">
                        <dl className="inline-flex items-center justify-center gap-2">
                          <dt className="sr-only">View Resume</dt>
                          <dd>
                            <Link
                              className="link-hover link-secondary link"
                              href={`/profile/resume/${profile.id}`}
                            >
                              View
                            </Link>
                          </dd>
                          <dt className="sr-only">Edit Resume</dt>
                          <dd>
                            <Link
                              className="link-hover link-secondary link"
                              href={`/profile/resume/${profile.id}/edit`}
                            >
                              Edit
                            </Link>
                          </dd>
                          <dt className="sr-only">Clone Resume</dt>
                          <dd>
                            <Link
                              className="link-hover link-secondary link"
                              href={`/profile/resume/${profile.id}/clone`}
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
  );
}

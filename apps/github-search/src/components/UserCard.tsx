import Image from "next/image";
import NextLink from "next/link";

interface UserCardProps {
  avatarUrl: string;
  username: string;
}

export default function UserCard({ avatarUrl, username }: UserCardProps) {
  return (
    <div className="flex flex-col items-center">
      <Image
        alt={username}
        className="size-16 rounded-full md:size-14 lg:size-16"
        height={64}
        src={avatarUrl}
        width={64}
      />
      <NextLink
        className="w-24 truncate text-center md:w-20 lg:w-24"
        href={`/user/${username}`}
      >
        {username}
      </NextLink>
    </div>
  );
}

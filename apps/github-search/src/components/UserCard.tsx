import {
  Avatar,
  LinkBox,
  LinkOverlay,
  useBreakpointValue,
  WrapItem,
} from "@chakra-ui/react";
import NextLink from "next/link";

interface UserCardProps {
  avatarUrl: string;
  username: string;
}

export default function UserCard({ avatarUrl, username }: UserCardProps) {
  const size = useBreakpointValue({ base: "2xl", md: "xl", lg: "2xl" });

  return (
    <LinkBox alignItems="center" as={WrapItem} flexDir="column">
      <Avatar name={username} size={size} src={avatarUrl} />
      <NextLink href={`/user/${username}`} passHref>
        <LinkOverlay noOfLines={1} textAlign="center" w={[32, 32, 24, 32, 32]}>
          {username}
        </LinkOverlay>
      </NextLink>
    </LinkBox>
  );
}

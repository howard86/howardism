import { Avatar, LinkBox, LinkOverlay, useBreakpointValue, WrapItem } from "@chakra-ui/react";
import NextLink from "next/link";
import { FC } from "react";

interface UserCardProps {
  avatarUrl: string;
  username: string;
}

const UserCard: FC<UserCardProps> = ({ avatarUrl, username }) => {
  const size = useBreakpointValue({ base: "2xl", md: "xl", lg: "2xl" });

  return (
    <LinkBox as={WrapItem} flexDir="column" alignItems="center">
      <Avatar name={username} src={avatarUrl} size={size} />
      <NextLink href={`/user/${username}`} passHref>
        <LinkOverlay w={[32, 32, 24, 32, 32]} textAlign="center" noOfLines={1}>
          {username}
        </LinkOverlay>
      </NextLink>
    </LinkBox>
  );
};

export default UserCard;

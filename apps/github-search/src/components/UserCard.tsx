import React, { FC } from "react";
import NextLink from "next/link";
import { Avatar, WrapItem, LinkBox, LinkOverlay, useBreakpointValue } from "@chakra-ui/react";

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
        <LinkOverlay w={[32, 32, 24, 32, 32]} textAlign="center" isTruncated>
          {username}
        </LinkOverlay>
      </NextLink>
    </LinkBox>
  );
};

export default UserCard;

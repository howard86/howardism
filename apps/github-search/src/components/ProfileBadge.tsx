import { Icon, Tooltip, WrapItem } from "@chakra-ui/react";
import React, { FC } from "react";

import matchIcon from "@/utils/match-icons";

interface ProfileBadgeProps {
  name: string;
}

const ProfileBadge: FC<ProfileBadgeProps> = ({ name }) => (
  <Tooltip label={name} aria-label={name + " tooltip"} placement="bottom-start">
    <WrapItem>
      <Icon fontSize="4xl" as={matchIcon(name)} />
    </WrapItem>
  </Tooltip>
);

export default ProfileBadge;

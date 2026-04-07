import { Icon, Tooltip, WrapItem } from "@chakra-ui/react";

import matchIcon from "@/utils/match-icons";

interface ProfileBadgeProps {
  name: string;
}

export default function ProfileBadge({ name }: ProfileBadgeProps) {
  return (
    <Tooltip
      aria-label={`${name} tooltip`}
      label={name}
      placement="bottom-start"
    >
      <WrapItem>
        <Icon as={matchIcon(name)} fontSize="4xl" />
      </WrapItem>
    </Tooltip>
  );
}

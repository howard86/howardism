import { Flex, Icon, Text, Tooltip } from "@chakra-ui/react";

import matchIcon from "@/utils/match-icons";

interface ProfileFieldProps {
  fieldKey: string;
  fieldValue: string | number;
}

export default function ProfileField({
  fieldKey,
  fieldValue,
}: ProfileFieldProps) {
  if (fieldValue === null || fieldValue === "") {
    return null;
  }

  return (
    <Flex fontSize={["md", "lg"]} my={[1, 2]}>
      <Text as="h2" fontWeight="medium" textTransform="capitalize" w="36">
        <Icon as={matchIcon(fieldKey)} fontSize="lg" mr="1" />
        {/* TODO: fix this quick workaround */}
        {fieldKey.replace("Username", "")}
      </Text>
      <Tooltip
        aria-label={`${fieldKey}'s tooltip`}
        label={fieldValue}
        placement="bottom-start"
      >
        <Text noOfLines={1} w="36">
          {fieldValue}
        </Text>
      </Tooltip>
    </Flex>
  );
}

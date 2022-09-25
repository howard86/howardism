import { Flex, Icon, Text, Tooltip } from "@chakra-ui/react";

import matchIcon from "@/utils/match-icons";

interface ProfileFieldProps {
  fieldKey: string;
  fieldValue: string | number;
}

export default function ProfileField({ fieldKey, fieldValue }: ProfileFieldProps) {
  if (fieldValue === null || fieldValue === "") {
    return null;
  }

  return (
    <Flex fontSize={["md", "lg"]} my={[1, 2]}>
      <Text as="h2" fontWeight="medium" w="36" textTransform="capitalize">
        <Icon mr="1" fontSize="lg" as={matchIcon(fieldKey)} />
        {/* TODO: fix this quick workaround */}
        {fieldKey.replace("Username", "")}
      </Text>
      <Tooltip label={fieldValue} aria-label={`${fieldKey}'s tooltip`} placement="bottom-start">
        <Text w="36" noOfLines={1}>
          {fieldValue}
        </Text>
      </Tooltip>
    </Flex>
  );
}

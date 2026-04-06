import {
  Box,
  type BoxProps,
  Button,
  Circle,
  Collapse,
  type ColorProps,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  useBoolean,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaCheck } from "react-icons/fa";

export interface Step {
  description: string;
  summary: string;
}

interface ProcedureStepProps extends BoxProps {
  steps: Step[];
}

const THEME_COLOR: ColorProps["color"] = "primary.600";
const LIGHT_THEME_COLOR: ColorProps["color"] = "primary.200";
const getCircleColor = (
  isViewed: boolean,
  isChecked: boolean
): BoxProps["color"] => {
  if (isViewed) {
    return "white";
  }

  return isChecked ? THEME_COLOR : "primary.800";
};

// TODO: refactor with useReducer
export default function ProcedureStep({ steps, ...props }: ProcedureStepProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const [expanded, { toggle }] = useBoolean(false);

  const isFirst = openIndex === 0;
  const isLast = openIndex === steps.length - 1;
  const afterLast = openIndex === steps.length;

  const handleNext = () => {
    setOpenIndex((index) => index + 1);
  };

  const handleBack = () => {
    setOpenIndex((index) => index - 1);
  };

  const handleReset = () => {
    setOpenIndex(0);
    if (expanded) {
      toggle();
    }
  };

  return (
    <Box {...props}>
      <Flex alignItems="center" justify="space-between" mb="4" p="2" w="full">
        <Heading fontSize={["lg", "xl"]}>料理步驟</Heading>
        <Button mx="2" onClick={toggle}>
          {expanded ? "收回" : "展開"}
        </Button>
      </Flex>
      {/* Note: this calculates the total height when expanded or not */}
      <Box
        minH={
          expanded
            ? `${92 * steps.length + 200}px`
            : `${60 * steps.length + 116}px`
        }
      >
        {steps.map((step, index) => {
          const isViewed = index === openIndex;
          const isChecked = index < openIndex;
          const showLastBox = index < steps.length - 1;

          return (
            <Box key={step.summary}>
              <HStack fontWeight="bold" spacing="4">
                <Circle
                  bg={isViewed ? THEME_COLOR : "white"}
                  borderColor={
                    isChecked || isViewed ? THEME_COLOR : LIGHT_THEME_COLOR
                  }
                  borderWidth="1pt"
                  color={getCircleColor(isViewed, isChecked)}
                  size="8"
                >
                  {!isChecked || expanded ? index + 1 : <Icon as={FaCheck} />}
                </Circle>
                <Text as="h2" fontSize="lg">
                  {step.summary}
                </Text>
              </HStack>
              <Collapse in={expanded || index === openIndex}>
                <Box
                  borderLeftColor={
                    isViewed || isChecked ? THEME_COLOR : LIGHT_THEME_COLOR
                  }
                  borderLeftWidth="1pt"
                  color="black"
                  ml="4"
                  mt="2"
                  pb="3"
                  pl="8"
                >
                  {step.description}
                  {!expanded && isViewed && (
                    <Flex justify="space-between" mt="4">
                      <Button isDisabled={isFirst} onClick={handleBack}>
                        上一步
                      </Button>
                      <Button onClick={handleNext}>
                        {isLast ? "完成！" : "下一步"}
                      </Button>
                    </Flex>
                  )}
                </Box>
              </Collapse>
              {showLastBox && (
                <Box
                  borderLeftColor={
                    isChecked || isViewed ? THEME_COLOR : LIGHT_THEME_COLOR
                  }
                  borderLeftWidth="1pt"
                  mb="2"
                  ml="4"
                  mt={isViewed || expanded ? 0 : 2}
                  p="2"
                />
              )}
            </Box>
          );
        })}
        {(afterLast || expanded) && (
          <Box p="4" textAlign="center">
            <Text my="4">料理完成！</Text>
            <Button onClick={handleReset}>重頭開始</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

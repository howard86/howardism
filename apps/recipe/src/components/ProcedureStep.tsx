import React, { FC, memo, useState } from "react";
import {
  Collapse,
  Box,
  Text,
  Button,
  HStack,
  Circle,
  Icon,
  ColorProps,
  useBoolean,
  Flex,
} from "@chakra-ui/react";
import { FaCheck } from "react-icons/fa";
import { Heading } from "@chakra-ui/react";

export interface Step {
  summary: string;
  description: string;
}

interface ProcedureStepProps {
  steps: Step[];
}

const THEME_COLOR: ColorProps["color"] = "primary.600";
const LIGHT_THEME_COLOR: ColorProps["color"] = "primary.200";

const getLast = <T extends unknown>(array: T[]): T => array[array.length - 1];

// TODO: refactor with useReducer
const ProcedureStep: FC<ProcedureStepProps> = ({ steps }) => {
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
    <>
      <Flex alignItems="center" justify={["space-between", "start"]} w="full">
        <Heading fontSize="lg">Steps</Heading>
        <Button onClick={toggle} mx="2">
          {expanded ? "Show less" : "Expand all"}
        </Button>
      </Flex>
      {/* Note: this calculates the total height when expanded or not */}
      <Box minH={expanded ? `${92 * steps.length + 200}px` : `${60 * steps.length + 116}px`}>
        {steps.map((step, index) => {
          const isViewed = index === openIndex;
          const isChecked = index < openIndex;
          const showLastBox = index < steps.length - 1;

          return (
            <Box key={step.summary}>
              <HStack fontWeight="bold" spacing="4">
                <Circle
                  size="8"
                  color={isViewed ? "white" : isChecked ? THEME_COLOR : "primary.800"}
                  bg={isViewed ? THEME_COLOR : "white"}
                  borderColor={isChecked || isViewed ? THEME_COLOR : LIGHT_THEME_COLOR}
                  borderWidth="1pt"
                >
                  {!isChecked || expanded ? index + 1 : <Icon as={FaCheck} />}
                </Circle>
                <Text as="h2" fontSize="lg">
                  {step.summary}
                </Text>
              </HStack>
              <Collapse in={expanded || index === openIndex}>
                <Box
                  color="black"
                  mt="2"
                  ml="4"
                  pl="8"
                  pb="3"
                  borderLeftWidth="1pt"
                  borderLeftColor={isViewed || isChecked ? THEME_COLOR : LIGHT_THEME_COLOR}
                >
                  {step.description}
                  {!expanded && isViewed && (
                    <HStack mt="4">
                      <Button isDisabled={isFirst} onClick={handleBack}>
                        Back
                      </Button>
                      <Button onClick={handleNext}>{isLast ? "Finish" : "Next"}</Button>
                    </HStack>
                  )}
                </Box>
              </Collapse>
              {showLastBox && (
                <Box
                  mt={isViewed || expanded ? 0 : 2}
                  mb="2"
                  ml="4"
                  p="2"
                  borderLeftWidth="1pt"
                  borderLeftColor={isChecked || isViewed ? THEME_COLOR : LIGHT_THEME_COLOR}
                />
              )}
            </Box>
          );
        })}
        {(afterLast || expanded) && (
          <HStack mt="4" ml="4">
            <Box>Congrats, well done!</Box>
            <Button onClick={handleReset}>Reset</Button>
          </HStack>
        )}
      </Box>
    </>
  );
};

const compareProps = (prev: ProcedureStepProps, next: ProcedureStepProps) =>
  prev.steps.length === next.steps.length &&
  prev.steps[0].summary === next.steps[0].summary &&
  prev.steps[0].description === next.steps[0].description &&
  getLast(prev.steps).summary === getLast(next.steps).summary &&
  getLast(prev.steps).description === getLast(prev.steps).description;

export default memo(ProcedureStep, compareProps);

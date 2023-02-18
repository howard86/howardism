import {
  Box,
  BoxProps,
  Button,
  Circle,
  Collapse,
  ColorProps,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  useBoolean,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaCheck } from "react-icons/fa"

export interface Step {
  summary: string
  description: string
}

interface ProcedureStepProps extends BoxProps {
  steps: Step[]
}

const THEME_COLOR: ColorProps["color"] = "primary.600"
const LIGHT_THEME_COLOR: ColorProps["color"] = "primary.200"
const getCircleColor = (isViewed: boolean, isChecked: boolean): BoxProps["color"] => {
  if (isViewed) return "white"

  return isChecked ? THEME_COLOR : "primary.800"
}

// TODO: refactor with useReducer
export default function ProcedureStep({ steps, ...props }: ProcedureStepProps) {
  const [openIndex, setOpenIndex] = useState(0)
  const [expanded, { toggle }] = useBoolean(false)

  const isFirst = openIndex === 0
  const isLast = openIndex === steps.length - 1
  const afterLast = openIndex === steps.length

  const handleNext = () => {
    setOpenIndex((index) => index + 1)
  }

  const handleBack = () => {
    setOpenIndex((index) => index - 1)
  }

  const handleReset = () => {
    setOpenIndex(0)
    if (expanded) {
      toggle()
    }
  }

  return (
    <Box {...props}>
      <Flex alignItems="center" justify="space-between" w="full" p="2" mb="4">
        <Heading fontSize={["lg", "xl"]}>料理步驟</Heading>
        <Button onClick={toggle} mx="2">
          {expanded ? "收回" : "展開"}
        </Button>
      </Flex>
      {/* Note: this calculates the total height when expanded or not */}
      <Box minH={expanded ? `${92 * steps.length + 200}px` : `${60 * steps.length + 116}px`}>
        {steps.map((step, index) => {
          const isViewed = index === openIndex
          const isChecked = index < openIndex
          const showLastBox = index < steps.length - 1

          return (
            <Box key={step.summary}>
              <HStack fontWeight="bold" spacing="4">
                <Circle
                  size="8"
                  color={getCircleColor(isViewed, isChecked)}
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
                    <Flex mt="4" justify="space-between">
                      <Button isDisabled={isFirst} onClick={handleBack}>
                        上一步
                      </Button>
                      <Button onClick={handleNext}>{isLast ? "完成！" : "下一步"}</Button>
                    </Flex>
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
          )
        })}
        {(afterLast || expanded) && (
          <Box p="4" textAlign="center">
            <Text my="4">料理完成！</Text>
            <Button onClick={handleReset}>重頭開始</Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}

import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react"
import { Field, FieldProps } from "formik"

interface RecipeFormAccordionItemProps<T> {
  newField: T
  formName: string
  fieldName: string
  fieldIndex: number
}

const mapKey = (key: string) => {
  switch (key) {
    case "name":
      return "名稱"

    case "amount":
      return "數量"

    case "unit":
      return "單位"

    case "processing":
      return "配料工序（選填）"

    case "summary":
      return "步驟簡稱"

    case "description":
      return "詳細說明"

    default:
      return key
  }
}

export default function RecipeFormAccordionItem<T extends Record<string, unknown>>({
  newField,
  formName,
  fieldName,
  fieldIndex,
}: RecipeFormAccordionItemProps<T>): JSX.Element {
  return (
    <AccordionItem w="full">
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left">
            {fieldName}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
        <VStack spacing="6">
          {Object.keys(newField).map((key) => {
            const id = `${formName}.${fieldIndex}.${key}`
            return (
              <Field name={id} key={id}>
                {({ field, form }: FieldProps<string[], Record<string, unknown>>) => (
                  <FormControl>
                    <Flex textAlign="center" alignItems="center">
                      <FormLabel htmlFor={id}>{mapKey(key)}</FormLabel>
                    </Flex>
                    <Input
                      {...field}
                      id={id}
                      placeholder={`${formName} ${key}`}
                      type={key === "amount" ? "number" : "text"}
                      step={key === "amount" ? 0.1 : undefined}
                    />
                    <FormErrorMessage>{form.errors[id]}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            )
          })}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  )
}

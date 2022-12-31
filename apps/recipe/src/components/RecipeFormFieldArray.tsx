import { HiMinusCircle, HiPlusCircle } from "react-icons/hi"
import { Accordion, Flex, Heading, IconButton, VStack } from "@chakra-ui/react"
import { nanoid } from "@reduxjs/toolkit"
import { FieldArray } from "formik"

import RecipeFormAccordionItem from "./RecipeFormAccordionItem"

interface RecipeFormFieldArrayProps<T> {
  title: string
  arrayFieldName: string
  arrayFieldDisplayKey: keyof T
  newArrayField: T
  arrayFields: T[]
}

export default function RecipeFormFieldArray<T extends Record<string, unknown>>({
  title,
  newArrayField,
  arrayFields,
  arrayFieldName,
  arrayFieldDisplayKey,
}: RecipeFormFieldArrayProps<T>): JSX.Element {
  return (
    <FieldArray name={arrayFieldName}>
      {({ remove, push }) => (
        <VStack align="stretch" w="full" spacing={1}>
          <Flex alignItems="center" justify="space-between">
            <Heading as="h3" fontSize="lg">
              {title}
            </Heading>
            <IconButton
              aria-label={`add ${arrayFieldName}`}
              variant="ghost"
              fontSize="4xl"
              icon={<HiPlusCircle />}
              onClick={() => push(newArrayField)}
            />
          </Flex>
          <Accordion reduceMotion allowToggle>
            {arrayFields.map((arrayField, index) => {
              const fieldKey = nanoid()

              return (
                <Flex key={`${arrayFieldName}-${fieldKey}`}>
                  <RecipeFormAccordionItem
                    formName={arrayFieldName}
                    fieldName={`#${fieldKey + 1} ${arrayField[arrayFieldDisplayKey]}`}
                    fieldIndex={index}
                    newField={arrayField}
                  />
                  <IconButton
                    aria-label={`remove ${fieldKey} ${arrayFieldName}`}
                    variant="ghost"
                    fontSize="4xl"
                    icon={<HiMinusCircle />}
                    onClick={() => remove(index)}
                  />
                </Flex>
              )
            })}
          </Accordion>
        </VStack>
      )}
    </FieldArray>
  )
}

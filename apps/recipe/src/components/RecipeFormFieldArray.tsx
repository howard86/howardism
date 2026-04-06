import { Accordion, Flex, Heading, IconButton, VStack } from "@chakra-ui/react";
import { nanoid } from "@reduxjs/toolkit";
import { FieldArray } from "formik";
import { HiMinusCircle, HiPlusCircle } from "react-icons/hi";

import RecipeFormAccordionItem from "./RecipeFormAccordionItem";

interface RecipeFormFieldArrayProps<T> {
  arrayFieldDisplayKey: keyof T;
  arrayFieldName: string;
  arrayFields: T[];
  newArrayField: T;
  title: string;
}

export default function RecipeFormFieldArray<
  T extends Record<string, unknown>,
>({
  title,
  newArrayField,
  arrayFields,
  arrayFieldName,
  arrayFieldDisplayKey,
}: RecipeFormFieldArrayProps<T>): JSX.Element {
  return (
    <FieldArray name={arrayFieldName}>
      {({ remove, push }) => (
        <VStack align="stretch" spacing={1} w="full">
          <Flex alignItems="center" justify="space-between">
            <Heading as="h3" fontSize="lg">
              {title}
            </Heading>
            <IconButton
              aria-label={`add ${arrayFieldName}`}
              fontSize="4xl"
              icon={<HiPlusCircle />}
              onClick={() => push(newArrayField)}
              variant="ghost"
            />
          </Flex>
          <Accordion allowToggle reduceMotion>
            {arrayFields.map((arrayField, index) => {
              const fieldKey = nanoid();

              return (
                <Flex key={`${arrayFieldName}-${fieldKey}`}>
                  <RecipeFormAccordionItem
                    fieldIndex={index}
                    fieldName={`#${fieldKey + 1} ${arrayField[arrayFieldDisplayKey]}`}
                    formName={arrayFieldName}
                    newField={arrayField}
                  />
                  <IconButton
                    aria-label={`remove ${fieldKey} ${arrayFieldName}`}
                    fontSize="4xl"
                    icon={<HiMinusCircle />}
                    onClick={() => remove(index)}
                    variant="ghost"
                  />
                </Flex>
              );
            })}
          </Accordion>
        </VStack>
      )}
    </FieldArray>
  );
}

import { Accordion, Flex, Heading, IconButton, VStack } from "@chakra-ui/react";
import { FieldArray } from "formik";
import React, { memo } from "react";
import { HiMinusCircle, HiPlusCircle } from "react-icons/hi";

import RecipeFormAccordionItem from "./RecipeFormAccordionItem";

interface RecipeFormFieldArrayProps<T> {
  arrayFieldName: string;
  arrayFieldDisplayKey: keyof T;
  newArrayField: T;
  arrayFields: T[];
}

const RecipeFormFieldArray = <T extends Record<string, unknown>>({
  newArrayField,
  arrayFields,
  arrayFieldName,
  arrayFieldDisplayKey,
}: RecipeFormFieldArrayProps<T>): JSX.Element => (
  <FieldArray name={arrayFieldName}>
    {({ remove, push }) => (
      <VStack align="stretch" w="full" spacing={1}>
        <Flex alignItems="center" justify="space-between">
          <Heading as="h3" fontSize="lg" textTransform="capitalize">
            {arrayFieldName}
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
          {arrayFields.map((arrayField, fieldIndex) => (
            <Flex key={`${arrayFieldName}-${fieldIndex}`}>
              <RecipeFormAccordionItem
                formName={arrayFieldName}
                fieldName={`#${fieldIndex + 1} ${arrayField[arrayFieldDisplayKey]}`}
                fieldIndex={fieldIndex}
                newField={arrayField}
              />
              <IconButton
                aria-label={`remove ${fieldIndex} ${arrayFieldName}`}
                variant="ghost"
                fontSize="4xl"
                icon={<HiMinusCircle />}
                onClick={() => remove(fieldIndex)}
              />
            </Flex>
          ))}
        </Accordion>
      </VStack>
    )}
  </FieldArray>
);

export default memo(RecipeFormFieldArray);

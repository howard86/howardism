import React, { memo } from "react";
import {
  AccordionItem,
  AccordionButton,
  Box,
  AccordionIcon,
  AccordionPanel,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";
import { Field } from "formik";

interface RecipeFormAccordionItemProps<T> {
  newField: T;
  formName: string;
  fieldName: string;
  fieldIndex: number;
}

const RecipeFormAccordionItem = <T extends Record<string, unknown>>({
  newField,
  formName,
  fieldName,
  fieldIndex,
}: RecipeFormAccordionItemProps<T>): JSX.Element => (
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
      <VStack spacing="2">
        {Object.keys(newField).map((key) => {
          const id = `${formName}.${fieldIndex}.${key}`;
          return (
            <Field name={id} key={id}>
              {({ field, form }) => (
                <FormControl>
                  <Flex textAlign="center" alignItems="center">
                    <FormLabel htmlFor={id} textTransform="capitalize">
                      {key}
                    </FormLabel>
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
          );
        })}
      </VStack>
    </AccordionPanel>
  </AccordionItem>
);

export default memo(RecipeFormAccordionItem);

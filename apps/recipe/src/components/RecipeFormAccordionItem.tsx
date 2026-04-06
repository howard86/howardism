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
} from "@chakra-ui/react";
import { Field, type FieldProps } from "formik";

interface RecipeFormAccordionItemProps<T> {
  fieldIndex: number;
  fieldName: string;
  formName: string;
  newField: T;
}

const mapKey = (key: string) => {
  switch (key) {
    case "name":
      return "名稱";

    case "amount":
      return "數量";

    case "unit":
      return "單位";

    case "processing":
      return "配料工序（選填）";

    case "summary":
      return "步驟簡稱";

    case "description":
      return "詳細說明";

    default:
      return key;
  }
};

export default function RecipeFormAccordionItem<
  T extends Record<string, unknown>,
>({
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
            const id = `${formName}.${fieldIndex}.${key}`;
            return (
              <Field key={id} name={id}>
                {({
                  field,
                  form,
                }: FieldProps<string[], Record<string, unknown>>) => (
                  <FormControl>
                    <Flex alignItems="center" textAlign="center">
                      <FormLabel htmlFor={id}>{mapKey(key)}</FormLabel>
                    </Flex>
                    <Input
                      {...field}
                      id={id}
                      placeholder={`${formName} ${key}`}
                      step={key === "amount" ? 0.1 : undefined}
                      type={key === "amount" ? "number" : "text"}
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
}

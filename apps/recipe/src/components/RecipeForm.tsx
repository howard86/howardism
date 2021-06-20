import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik, FormikHelpers } from "formik";
import React, { useState } from "react";

import useAppToast from "@/hooks/useAppToast";
import api, { LocalAPIResponse } from "@/redux/api";
import type { RawIngredient, RawRecipe, RawStep } from "@/types/recipe";

import RecipeFormFieldArray from "./RecipeFormFieldArray";

// Same as newSeasoning for now
const newIngredient: RawIngredient = {
  name: "",
  amount: 0,
  unit: "",
  processing: "",
};

const newStep: RawStep = {
  summary: "",
  description: "",
};

const initialValues: RawRecipe = {
  title: "",
  description: "",
  ingredients: [newIngredient],
  seasonings: [newIngredient],
  steps: [newStep],
};

const RecipeForm = (): JSX.Element => {
  const [isChecked, setChecked] = useState(false);
  const toast = useAppToast();

  const validateString = (field?: string) => {
    if (!field) {
      return "This field must not be empty";
    }
  };

  const handleOnSubmit = async (value: RawRecipe, actions: FormikHelpers<RawRecipe>) => {
    try {
      const response = await api.post<LocalAPIResponse>("/recipe/create", value);

      if (!response.data.success) {
        throw new Error("Local API with 200 but failed to create");
      }

      toast({ status: "success", description: `Created recipe ${value.title}` });
      actions.resetForm({
        values: initialValues,
      });
    } catch (error) {
      console.error(error);
      toast({ status: "error", description: `Failed to create recipe ${value.title}` });
      actions.setSubmitting(false);
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleOnSubmit}>
      {({ isSubmitting, isValid, values }) => (
        <Form>
          <VStack spacing="6">
            <Field name="title" validate={validateString}>
              {({ field, form }: FieldProps<string[], RawRecipe>) => (
                <FormControl isInvalid={form.errors.title === "" && form.touched.title}>
                  <FormLabel htmlFor="title">Title</FormLabel>
                  <Input {...field} id="title" placeholder="recipe title" />
                  <FormErrorMessage>{form.errors.title}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="description" validate={validateString}>
              {({ field, form }: FieldProps<string[], RawRecipe>) => (
                <FormControl isInvalid={form.errors.description === "" && form.touched.description}>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <Input {...field} id="description" placeholder="recipe description" />
                  <FormErrorMessage>{form.errors.description}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <RecipeFormFieldArray
              arrayFieldName="ingredients"
              arrayFieldDisplayKey="name"
              newArrayField={newIngredient}
              arrayFields={values.ingredients}
            />
            <RecipeFormFieldArray
              arrayFieldName="seasonings"
              arrayFieldDisplayKey="name"
              newArrayField={newIngredient}
              arrayFields={values.seasonings}
            />
            <RecipeFormFieldArray
              arrayFieldName="steps"
              arrayFieldDisplayKey="summary"
              newArrayField={newStep}
              arrayFields={values.steps}
            />
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="content-checked" mb="0">
                Finalize the contents?
              </FormLabel>
              <Switch
                id="content-checked"
                isChecked={isChecked}
                colorScheme="messenger"
                onChange={() => setChecked(!isChecked)}
              />
            </FormControl>
            <Button
              type="submit"
              size="lg"
              fontSize="md"
              isLoading={isSubmitting}
              isDisabled={!isChecked}
              isActive={isValid}
            >
              Create Recipe!
            </Button>
          </VStack>
        </Form>
      )}
    </Formik>
  );
};

export default RecipeForm;

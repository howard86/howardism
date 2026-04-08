"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import useAppToast from "@/hooks/useAppToast";
import api, { type LocalAPIResponse } from "@/redux/api";

import RecipeFormFieldArray from "./RecipeFormFieldArray";

const ingredientSchema = z.object({
  name: z.string(),
  amount: z.coerce.number(),
  unit: z.string(),
  processing: z.string().optional().default(""),
});

const stepSchema = z.object({
  summary: z.string().min(1, "步驟簡稱不得為空"),
  description: z.string().min(1, "詳細說明不得為空"),
});

const recipeSchema = z.object({
  title: z.string().min(1, "食譜名稱不得為空"),
  description: z.string().min(1, "食譜介紹不得為空"),
  ingredients: z.array(ingredientSchema),
  seasonings: z.array(ingredientSchema),
  steps: z.array(stepSchema),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;

const newIngredient: RecipeFormValues["ingredients"][number] = {
  name: "",
  amount: 0,
  unit: "",
  processing: "",
};

const newStep: RecipeFormValues["steps"][number] = {
  summary: "",
  description: "",
};

const defaultValues: RecipeFormValues = {
  title: "",
  description: "",
  ingredients: [],
  seasonings: [],
  steps: [],
};

export default function RecipeForm(): JSX.Element {
  const [isChecked, setChecked] = useState(false);
  const toast = useAppToast();

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  });

  const handleOnSubmit = async (value: RecipeFormValues) => {
    try {
      const response = await api.post<LocalAPIResponse>(
        "/recipe/create",
        value
      );

      if (!response.data.success) {
        throw new Error("Local API with 200 but failed to create");
      }

      toast({
        status: "success",
        description: `Created recipe ${value.title}`,
      });
      form.reset(defaultValues);
    } catch (_error) {
      toast({
        status: "error",
        description: `Failed to create recipe ${value.title}`,
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleOnSubmit)}>
        <div className="grid gap-2">
          <label className="font-medium text-sm" htmlFor="title">
            食譜名稱
          </label>
          <input
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
            id="title"
            placeholder="recipe title"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-destructive text-sm">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="font-medium text-sm" htmlFor="description">
            食譜介紹
          </label>
          <input
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
            id="description"
            placeholder="recipe description"
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-destructive text-sm">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <RecipeFormFieldArray
          arrayFieldDisplayKey="name"
          arrayFieldName="ingredients"
          newArrayField={newIngredient}
          title="材料"
        />
        <RecipeFormFieldArray
          arrayFieldDisplayKey="name"
          arrayFieldName="seasonings"
          newArrayField={newIngredient}
          title="調味料"
        />
        <RecipeFormFieldArray
          arrayFieldDisplayKey="summary"
          arrayFieldName="steps"
          newArrayField={newStep}
          title="料理步驟"
        />

        <div className="flex items-center gap-3">
          <input
            aria-checked={isChecked}
            checked={isChecked}
            className="h-4 w-8 cursor-pointer rounded-full accent-primary"
            id="content-checked"
            onChange={() => setChecked(!isChecked)}
            role="switch"
            type="checkbox"
          />
          <label className="text-sm" htmlFor="content-checked">
            請確認送出後將無法變更食譜內容！
          </label>
        </div>

        <button
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-base text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
          disabled={!isChecked || form.formState.isSubmitting}
          type="submit"
        >
          上傳食譜
        </button>
      </form>
    </FormProvider>
  );
}

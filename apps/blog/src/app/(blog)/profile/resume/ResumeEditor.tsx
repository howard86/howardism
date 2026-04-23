"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@howardism/ui/components/button";
import { useRouter } from "next/navigation";
import type { SuccessApiResponse } from "next-api-handler";
import { useState } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";

import { Container } from "@/app/(common)/Container";

import ResumeDocument from "./ResumeDocument";
import ResumeForm, { DEFAULT_RESUME_FORM } from "./ResumeForm";
import { type ResumeSchema, resumeSchema } from "./schema";

interface ResumeLiveViewProps {
  control: Control<ResumeSchema>;
}

function ResumeLiveView({ control }: ResumeLiveViewProps) {
  const values = useWatch({
    control,
  }) as ResumeSchema;

  const [cachedState, setCachedState] = useState(values);

  const handleRefresh = () => {
    setCachedState(values);
  };

  return (
    // TODO: replace with other preview layout
    <section className="mt-20">
      <div className="my-4 flex items-center justify-center">
        <Button onClick={handleRefresh} type="button">
          Refresh
        </Button>
      </div>
      <ResumeDocument {...cachedState} />
    </section>
  );
}

interface ResumeEditorProps {
  profileId?: string;
  resume?: ResumeSchema;
}

export default function ResumeEditor({
  profileId,
  resume = DEFAULT_RESUME_FORM,
}: ResumeEditorProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResumeSchema>({
    mode: "onBlur",
    resolver: zodResolver(resumeSchema),
    defaultValues: resume,
  });

  const handleCreate = handleSubmit(async (values) => {
    try {
      // email is session-pinned server-side (#591); strip it from the request body
      const { email: _email, ...bodyWithoutEmail } = values;
      const response = await fetch(
        profileId ? `/api/resume?profileId=${profileId}` : "/api/resume",
        {
          method: profileId ? "PUT" : "POST",
          body: JSON.stringify(bodyWithoutEmail),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        setError("root", {
          message: "Something went wrong. Please try again.",
        });
        return;
      }

      const result = (await response.json()) as SuccessApiResponse<string> & {
        message?: string;
      };

      if (result.success) {
        router.push(`/profile/resume/${result.data}`);
      } else {
        setError("root", {
          message: result.message ?? "Something went wrong. Please try again.",
        });
      }
    } catch (err) {
      setError("root", {
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    }
  });

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      {errors.root?.message && <p role="alert">{errors.root.message}</p>}
      <ResumeForm
        control={control}
        errors={errors}
        onSubmit={handleCreate}
        register={register}
      />
      <ResumeLiveView control={control} />
    </Container>
  );
}

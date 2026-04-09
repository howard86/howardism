"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@howardism/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@howardism/ui/components/form";
import { Input } from "@howardism/ui/components/input";
import { Eye, EyeOff } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Email must be a valid format"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password requires 6 or more characters"),
});

export type FormValue = z.infer<typeof loginSchema>;
export type OnLogin = (value: FormValue) => Promise<void>;

interface LoginFormProps {
  onLogin: OnLogin;
}

export default function LoginForm({
  onLogin,
}: LoginFormProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValue>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onLogin)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input autoComplete="email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    autoComplete="current-password"
                    className="pr-10"
                    type={showPassword ? "text" : "password"}
                    {...field}
                  />
                  <Button
                    aria-label={
                      showPassword ? "Mask password" : "Reveal password"
                    }
                    className="absolute top-0 right-0 h-full"
                    onClick={() => setShowPassword((prev) => !prev)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="w-full"
          disabled={form.formState.isSubmitting}
          size="lg"
          type="submit"
        >
          Sign in
        </Button>
      </form>
    </Form>
  );
}

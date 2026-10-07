"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";

function messageFor(failure: {
  status?: number;
  code?: string;
  message?: string;
}) {
  if (failure.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (failure.code?.startsWith("USER_ALREADY_EXISTS")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (failure.code === "PASSWORD_TOO_SHORT") {
    return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return failure.message || "We couldn't create your account. Please try again.";
}

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (name.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setPending(true);
    const { error: failure } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (failure) {
      setPending(false);
      setError(messageFor(failure));
      return;
    }

    // After signing up you are signed in automatically
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className="mt-2"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          At least {MIN_PASSWORD_LENGTH} characters. A few words together make a
          strong, easy-to-remember password.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
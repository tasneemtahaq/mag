"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Please enter your email and your password.");
      return;
    }

    setPending(true);
    const { error: failure } = await authClient.signIn.email({ email, password });

    if (failure) {
      setPending(false);
      // The same message for a wrong email or a wrong password, on purpose
      setError(
        failure.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : "Incorrect email or password.",
      );
      return;
    }

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
          autoComplete="current-password"
          required
          className="mt-2"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
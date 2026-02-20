"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(ta("passwordsDoNotMatch"));
      return;
    }

    if (password.length < 8) {
      setError(ta("passwordTooShort"));
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError(ta("passwordComplexity"));
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || tc("error"));
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(ta("signInFailed"));
      setLoading(false);
    } else {
      router.push("/chat");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            T
          </div>
          <span className="text-xl font-bold text-foreground">This Story</span>
        </div>
        <CardTitle>{ta("createAccountTitle")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {ta("createAccountDescription")}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={ta("name")}
            type="text"
            placeholder={ta("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={tc("email")}
            type="email"
            placeholder={ta("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={tc("password")}
            type="password"
            placeholder={ta("passwordMinLength")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label={ta("confirmPassword")}
            type="password"
            placeholder={ta("confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            {ta("createAccount")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {ta("hasAccount")} {" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            {tc("signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

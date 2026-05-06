"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Check, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

const passwordRules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = useMemo(() => passwordRules.filter((r) => r.test(password)).length, [password]);
  const allRulesPass = passwordStrength === passwordRules.length;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!allRulesPass) {
      toast.error("Password does not meet the requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created! Welcome aboard.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Image
        src="https://images.unsplash.com/photo-1601598851547-4302969d0614?w=1800"
        alt="Logistics warehouse shelves"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/72" />
      <section className="relative z-10 grid min-h-screen place-items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Card className="rounded-lg border-white/20 bg-white/92 p-6 shadow-2xl dark:bg-slate-950/88">
            <Link href="/login" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="size-4" />
                  Get started
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Set up your credentials to access the platform.</p>
              </div>
              <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Building2 />
              </div>
            </div>

            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            passwordStrength >= i
                              ? passwordStrength <= 2
                                ? "bg-red-500"
                                : passwordStrength === 3
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {passwordRules.map((rule) => (
                        <p
                          key={rule.label}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            rule.test(password) ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          }`}
                        >
                          <Check className={`size-3 ${rule.test(password) ? "opacity-100" : "opacity-0"}`} />
                          {rule.label}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-9 pr-10 ${
                      confirmPassword.length > 0 && !passwordsMatch
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <Button size="lg" type="submit" disabled={loading || !allRulesPass || !passwordsMatch} className="mt-1">
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Already registered?</span>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Have an account?{" "}
              <Link className="font-medium text-primary hover:underline" href="/login">
                Sign in instead
              </Link>
            </p>
          </Card>
        </motion.div>
      </section>
    </main>
  );
}

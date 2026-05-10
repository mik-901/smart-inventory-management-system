"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success("Welcome back!");
      
      if (user.role === "admin") {
        router.push("/dashboard");
      } else if (user.role === "manager") {
        router.push("/warehouses");
      } else if (user.role === "staff") {
        router.push("/inventory");
      } else {
        router.push("/reports");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Image
        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1800"
        alt="Modern warehouse inventory operations"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.18),transparent_28%)]" />

      <section className="relative z-10 grid min-h-screen place-items-center px-4 py-8">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-white"
          >
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <Boxes className="size-4 text-teal-300" />
              Realtime warehouse intelligence
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">
              Smart Inventory Management System
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Stock accuracy, order flow, low-stock alerts, audit history, AI reorder suggestions, and warehouse
              performance in one polished command center.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-100 sm:grid-cols-3">
              {["Multi-warehouse stock", "Role-based access", "Offline-ready PWA"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-teal-300" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Card className="rounded-lg border-white/20 bg-white/92 p-6 shadow-2xl dark:bg-slate-950/85">
              <div className="mb-6">
                <p className="text-sm font-medium text-primary">Secure access</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal">Sign in to your account</h2>
                <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to access your workspace.</p>
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
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
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-9"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-9 pr-10"
                      autoComplete="current-password"
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
                </div>
                <Button className="w-full" size="lg" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">New here?</span>
                </div>
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link className="font-medium text-primary hover:underline" href="/register">
                  Create an account
                </Link>
              </p>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, CheckCircle2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoCredentials } from "@/lib/demo-data";
import { loginWithDemoCredentials } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("inventory123");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = loginWithDemoCredentials(email, password);

    if (!session) {
      toast.error("Invalid demo credentials");
      return;
    }

    toast.success(`Welcome back, ${session.name}`);
    router.push("/dashboard");
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
                <h2 className="mt-2 text-2xl font-semibold tracking-normal">Sign in to workspace</h2>
                <p className="mt-2 text-sm text-muted-foreground">Use a demo profile or connect Clerk in production.</p>
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button className="w-full" size="lg" type="submit">
                  Open Dashboard
                  <ArrowRight />
                </Button>
              </form>

              <div className="mt-6 rounded-lg border bg-muted/45 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Demo credentials</p>
                <div className="mt-3 grid gap-2 text-xs">
                  {demoCredentials.map((credential) => (
                    <button
                      key={credential.email}
                      className="flex items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-background"
                      onClick={() => {
                        setEmail(credential.email);
                        setPassword(credential.password);
                      }}
                    >
                      <span className="font-medium">{credential.email}</span>
                      <span className="text-muted-foreground">{credential.role.replaceAll("_", " ")}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                New workspace?{" "}
                <Link className="font-medium text-primary hover:underline" href="/register">
                  Create company account
                </Link>
              </p>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function RegisterPage() {
  const router = useRouter();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Demo workspace created. Sign in with admin@demo.com.");
    router.push("/login");
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
          className="w-full max-w-2xl"
        >
          <Card className="rounded-lg border-white/20 bg-white/92 p-6 shadow-2xl dark:bg-slate-950/88">
            <Link href="/login" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back to login
            </Link>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="size-4" />
                  Company onboarding
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal">Create inventory workspace</h1>
              </div>
              <div className="grid size-12 place-items-center rounded-lg bg-primary/12 text-primary">
                <Building2 />
              </div>
            </div>

            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company name</Label>
                  <Input id="company" required placeholder="Acme Retail Pvt Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select id="industry" defaultValue="retail">
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="distribution">Distribution</option>
                    <option value="healthcare">Healthcare</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Admin name</Label>
                  <Input id="name" required placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" required placeholder="you@company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Primary warehouse address</Label>
                <Textarea id="address" placeholder="Address, city, state, postal code" />
              </div>
              <Button size="lg" type="submit">
                Create Workspace
              </Button>
            </form>
          </Card>
        </motion.div>
      </section>
    </main>
  );
}

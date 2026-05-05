"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  trend,
  icon: Icon,
  tone = "teal"
}: {
  title: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "blue" | "rose" | "emerald";
}) {
  const tones = {
    teal: "bg-teal-500/12 text-teal-600 dark:text-teal-300",
    amber: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    blue: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    rose: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    emerald: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 text-2xl font-semibold tracking-normal">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
          </div>
          <div className={cn("grid size-11 place-items-center rounded-lg", tones[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

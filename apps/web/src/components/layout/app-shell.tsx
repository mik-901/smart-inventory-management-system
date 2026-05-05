"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, ChevronLeft, LogOut, Menu, Moon, Search, Sun, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";

import { NotificationCenter } from "@/components/layout/notification-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canAccess, getSession, logout, type DemoSession } from "@/lib/auth";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const active = getSession();
    if (!active) {
      router.replace("/login");
      return;
    }
    setSession(active);
  }, [router]);

  const visibleItems = useMemo(() => {
    if (!session) return navigationItems.filter((item) => !item.secondary);
    return navigationItems.filter((item) => {
      const area = item.href.split("?")[0].replace("/", "") || "dashboard";
      return !item.secondary && canAccess(session.role, area);
    });
  }, [session]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const sidebar = (
    <aside
      className={cn(
        "glass-panel fixed inset-y-0 left-0 z-40 flex flex-col border-y-0 border-l-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen",
        collapsed ? "w-[88px]" : "w-[280px]"
      )}
    >
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
          <Boxes className="size-5" />
        </div>
        {!collapsed ? (
          <div>
            <p className="text-sm font-bold">Smart Inventory</p>
            <p className="text-xs text-muted-foreground">Enterprise Control Tower</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href.split("?")[0];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          className={cn("w-full", collapsed && "px-0")}
          variant="ghost"
          onClick={() => setCollapsed((value) => !value)}
          aria-label="Collapse navigation"
        >
          <ChevronLeft className={cn("transition-transform", collapsed && "rotate-180")} />
          {!collapsed ? "Collapse" : null}
        </Button>
      </div>
    </aside>
  );

  if (!session) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="soft-grid min-h-screen bg-background">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">{sidebar}</div>
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {sidebar}
              <Button className="absolute right-4 top-4" variant="outline" size="icon" onClick={() => setMobileOpen(false)}>
                <X />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b bg-background/72 backdrop-blur-xl">
            <div className="flex min-h-20 flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <Button className="lg:hidden" variant="outline" size="icon" onClick={() => setMobileOpen(true)}>
                  <Menu />
                </Button>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">{title}</h1>
                    <Badge variant="success">Live sync</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search SKU, order, warehouse" />
                </div>
                <NotificationCenter />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                <div className="flex items-center gap-3 rounded-md border bg-background/60 px-3 py-2">
                  <div className="grid size-8 place-items-center rounded-md bg-primary/12 text-primary">
                    <UserRound className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{session.name}</p>
                    <p className="text-[11px] text-muted-foreground">{session.role.replaceAll("_", " ")}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                    <LogOut />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="px-4 py-6 sm:px-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

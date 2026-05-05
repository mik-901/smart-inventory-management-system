"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { notifications } from "@/lib/demo-data";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>(notifications.filter((item) => item.read).map((item) => item.id));
  const unreadCount = useMemo(() => notifications.filter((item) => !read.includes(item.id)).length, [read]);

  return (
    <div className="relative">
      <Button variant="outline" size="icon" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
        <Bell />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            {unreadCount}
          </span>
        ) : null}
      </Button>
      {open ? (
        <Card className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] overflow-hidden">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <p className="text-sm font-semibold">Notification Center</p>
              <p className="text-xs text-muted-foreground">{unreadCount} unread alerts</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRead(notifications.map((item) => item.id))}>
              <CheckCheck />
              Mark read
            </Button>
          </div>
          <div className="max-h-96 overflow-auto">
            {notifications.map((item) => (
              <button
                key={item.id}
                className="flex w-full flex-col gap-2 border-b p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() => setRead((current) => Array.from(new Set([...current, item.id])))}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  {!read.includes(item.id) ? <Badge variant="warning">New</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{item.message}</p>
                <p className="text-[11px] text-muted-foreground">{item.time}</p>
              </button>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

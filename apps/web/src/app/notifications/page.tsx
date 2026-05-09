"use client";

import { CheckCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const { data: rows, refetch, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead(refetch);
  const markAll = useMarkAllNotificationsRead(refetch);

  return (
    <AppShell title="Notifications" subtitle="Low stock, reorder, order, and system notifications.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Notification Center</CardTitle>
            <Button variant="outline" onClick={() => void markAll.mutate()}><CheckCheck className="size-4" />Mark all read</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow><TableHead>Title</TableHead><TableHead>Message</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading notifications...</TableCell></TableRow> : null}
              {rows.map((row) => (
                <TableRow key={row.id} onClick={() => void markRead.mutate(row.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.message}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell><Badge variant={row.read || row.isRead ? "secondary" : "warning"}>{row.read || row.isRead ? "Read" : "Unread"}</Badge></TableCell>
                  <TableCell>{row.time}</TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No notifications</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

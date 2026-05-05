import { Clock, History, LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { activities, users } from "@/lib/demo-data";

export default function ActivityPage() {
  return (
    <AppShell title="Activity Logs" subtitle="Audit trail, inventory history, role changes, and login history.">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <History className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Audit Events</p>
          <p className="mt-2 text-2xl font-semibold">9,284</p>
        </Card>
        <Card className="p-5">
          <LockKeyhole className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Login Records</p>
          <p className="mt-2 text-2xl font-semibold">{users.length}</p>
        </Card>
        <Card className="p-5">
          <Clock className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Retention</p>
          <p className="mt-2 text-2xl font-semibold">7 yrs</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Who changed what, when, and which entity was affected.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.actor}</TableCell>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{activity.entity}</TableCell>
                  <TableCell>
                    <Badge variant={activity.tone === "danger" ? "danger" : activity.tone === "warning" ? "warning" : "success"}>
                      {activity.tone}
                    </Badge>
                  </TableCell>
                  <TableCell>{activity.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

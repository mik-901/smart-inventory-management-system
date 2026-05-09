"use client";

import { useMemo, useState } from "react";
import { Clock, History, LockKeyhole, Search } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActivity } from "@/hooks/useDashboard";

export default function ActivityPage() {
  const { data: activities, isLoading } = useActivity();
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = activities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => [a.actor, a.action, a.entity].join(" ").toLowerCase().includes(q));
    }
    if (severityFilter !== "all") {
      list = list.filter((a) => a.tone === severityFilter);
    }
    return list;
  }, [searchQuery, severityFilter]);

  return (
    <AppShell title="Activity Logs" subtitle="Audit trail, inventory history, role changes, and login history.">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <History className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Audit Events</p>
          <p className="mt-2 text-2xl font-semibold">{activities.length.toLocaleString()}</p>
        </Card>
        <Card className="p-5">
          <LockKeyhole className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Login Records</p>
          <p className="mt-2 text-2xl font-semibold">Live</p>
        </Card>
        <Card className="p-5">
          <Clock className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Retention</p>
          <p className="mt-2 text-2xl font-semibold">7 yrs</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Who changed what, when, and which entity was affected.</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select className="w-32" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </Select>
            </div>
          </div>
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
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading activity...</TableCell></TableRow>
              ) : null}
              {filtered.map((activity) => (
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
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No activity matches your search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

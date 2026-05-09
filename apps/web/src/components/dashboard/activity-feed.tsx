import { Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivity } from "@/hooks/useDashboard";

export function ActivityFeed() {
  const { data: activities } = useActivity();
  const variant = {
    success: "success",
    warning: "warning",
    info: "default",
    danger: "danger"
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Audit-ready changes across stock, orders, and users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="mt-1">
              <Circle className="size-3 fill-primary text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{activity.actor}</p>
                <Badge variant={variant[(activity.tone as keyof typeof variant) ?? "info"]}>{activity.entity}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{activity.action}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 ? <p className="text-sm text-muted-foreground">No audit activity yet.</p> : null}
      </CardContent>
    </Card>
  );
}

import { BrainCircuit, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { reorderSuggestions } from "@/lib/demo-data";

export function ReorderWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>AI Demand Prediction</CardTitle>
            <CardDescription>Smart reorder suggestions from stock velocity</CardDescription>
          </div>
          <div className="grid size-10 place-items-center rounded-lg bg-primary/12 text-primary">
            <BrainCircuit className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reorderSuggestions.map((item) => (
          <div key={item.sku} className="rounded-lg border bg-background/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.product}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.sku}</p>
              </div>
              <Badge variant="success">{item.confidence}% confidence</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{item.reason}</p>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span>Suggested PO quantity</span>
              <span className="font-semibold">{item.suggestedQty}</span>
            </div>
            <Progress className="mt-2" value={item.confidence} />
          </div>
        ))}
        <Button className="w-full" variant="secondary">
          <Sparkles />
          Generate Purchase Draft
        </Button>
      </CardContent>
    </Card>
  );
}

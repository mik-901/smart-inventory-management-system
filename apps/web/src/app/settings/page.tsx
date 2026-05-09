"use client";

import { useEffect, useState } from "react";
import { BellRing, Building2, Palette, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api";

interface Settings {
  companyName: string;
  gstId: string;
  currency: string;
  taxRate: string;
  lowStockChannel: string;
  reportTime: string;
  aiApprovals: string;
  emailFrom: string;
  theme: string;
  sessionTimeout: string;
  accessReview: string;
}

const defaults: Settings = {
  companyName: "SmartOps Retail Pvt Ltd",
  gstId: "27ABCDE1234F1Z5",
  currency: "INR",
  taxRate: "18%",
  lowStockChannel: "email_push",
  reportTime: "09:00",
  aiApprovals: "manager",
  emailFrom: "inventory@example.com",
  theme: "system",
  sessionTimeout: "8",
  accessReview: "30"
};

function loadSettings(): Settings {
  return defaults;
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(defaults);
  useEffect(() => {
    void apiClient.get<Record<string, { value: any }>>("/api/settings").then((settings) => {
      setS((current) => ({
        ...current,
        companyName: settings.company?.value?.name ?? current.companyName,
        currency: settings.localization?.value?.currency ?? current.currency,
        lowStockChannel: settings.alerts?.value?.emailLowStock ? "email_push" : current.lowStockChannel
      }));
    }).catch(() => setS(loadSettings()));
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const saveSection = async (label: string) => {
    await apiClient.put("/api/settings", {
      company: { name: s.companyName, gstId: s.gstId, emailFrom: s.emailFrom },
      localization: { currency: s.currency, taxRate: s.taxRate, timezone: "Asia/Kolkata" },
      alerts: { lowStockChannel: s.lowStockChannel, reportTime: s.reportTime, aiApprovals: s.aiApprovals },
      security: { sessionTimeoutHours: s.sessionTimeout, accessReviewDays: s.accessReview }
    });
    toast.success(`${label} saved`);
  };
  return (
    <AppShell title="Settings" subtitle="Company profile, currency, GST/tax, notification, security, and theme preferences.">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Company Profile
            </CardTitle>
            <CardDescription>Business identity used on reports, orders, and email alerts.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company name</Label>
                <Input value={s.companyName} onChange={(e) => update("companyName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GST / Tax ID</Label>
                <Input value={s.gstId} onChange={(e) => update("gstId", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select className="w-full" value={s.currency} onChange={(e) => update("currency", e.target.value)}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax rate</Label>
                <Input value={s.taxRate} onChange={(e) => update("taxRate", e.target.value)} />
              </div>
            </div>
            <Button onClick={() => void saveSection("Company settings")}>
              <Save />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-5 text-primary" />
              Notification Settings
            </CardTitle>
            <CardDescription>Low-stock, reorder, dispatch, returns, and email alert preferences.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Low-stock channel</Label>
                <Select className="w-full" value={s.lowStockChannel} onChange={(e) => update("lowStockChannel", e.target.value)}>
                  <option value="email_push">Email + Push</option>
                  <option value="email">Email</option>
                  <option value="push">Push</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Daily report time</Label>
                <Input type="time" value={s.reportTime} onChange={(e) => update("reportTime", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>AI reorder approvals</Label>
                <Select className="w-full" value={s.aiApprovals} onChange={(e) => update("aiApprovals", e.target.value)}>
                  <option value="manager">Manager approval</option>
                  <option value="admin">Super Admin only</option>
                  <option value="auto">Auto draft</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email from</Label>
                <Input value={s.emailFrom} onChange={(e) => update("emailFrom", e.target.value)} />
              </div>
            </div>
            <Button onClick={() => void saveSection("Notification settings")}>
              <Save />
              Save Alerts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              Theme Settings
            </CardTitle>
            <CardDescription>Workspace visual preferences for teams and shared screens.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Default theme</Label>
              <Select className="w-full" value={s.theme} onChange={(e) => update("theme", e.target.value)}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </div>
            <Button variant="secondary" onClick={() => void saveSection("Theme preference")}>
              <Save />
              Save Theme
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>JWT audience, session limits, encryption posture, and access review cadence.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Session timeout</Label>
                <Select className="w-full" value={s.sessionTimeout} onChange={(e) => update("sessionTimeout", e.target.value)}>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours</option>
                  <option value="12">12 hours</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Access review</Label>
                <Select className="w-full" value={s.accessReview} onChange={(e) => update("accessReview", e.target.value)}>
                  <option value="30">Every 30 days</option>
                  <option value="60">Every 60 days</option>
                  <option value="90">Every 90 days</option>
                </Select>
              </div>
            </div>
            <Button variant="secondary" onClick={() => void saveSection("Security settings")}>
              <Save />
              Save Security
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

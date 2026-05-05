"use client";

import { BellRing, Building2, Palette, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default function SettingsPage() {
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
                <Input defaultValue="SmartOps Retail Pvt Ltd" />
              </div>
              <div className="space-y-2">
                <Label>GST / Tax ID</Label>
                <Input defaultValue="27ABCDE1234F1Z5" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select className="w-full" defaultValue="INR">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax rate</Label>
                <Input defaultValue="18%" />
              </div>
            </div>
            <Button onClick={() => toast.success("Company settings saved")}>
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
                <Select className="w-full" defaultValue="email_push">
                  <option value="email_push">Email + Push</option>
                  <option value="email">Email</option>
                  <option value="push">Push</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Daily report time</Label>
                <Input type="time" defaultValue="09:00" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>AI reorder approvals</Label>
                <Select className="w-full" defaultValue="manager">
                  <option value="manager">Manager approval</option>
                  <option value="admin">Super Admin only</option>
                  <option value="auto">Auto draft</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email from</Label>
                <Input defaultValue="inventory@example.com" />
              </div>
            </div>
            <Button onClick={() => toast.success("Notification settings saved")}>
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
              <Select className="w-full" defaultValue="system">
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </div>
            <Button variant="secondary" onClick={() => toast.success("Theme preference saved")}>
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
                <Select className="w-full" defaultValue="8">
                  <option value="4">4 hours</option>
                  <option value="8">8 hours</option>
                  <option value="12">12 hours</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Access review</Label>
                <Select className="w-full" defaultValue="30">
                  <option value="30">Every 30 days</option>
                  <option value="60">Every 60 days</option>
                  <option value="90">Every 90 days</option>
                </Select>
              </div>
            </div>
            <Button variant="secondary" onClick={() => toast.success("Security settings saved")}>
              <Save />
              Save Security
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

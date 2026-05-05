"use client";

import { useState } from "react";
import { Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { users as initialUsers } from "@/lib/demo-data";
import type { AppUser, UserRole } from "@/types";

const roleLabel: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  WAREHOUSE_STAFF: "Warehouse Staff",
  VIEWER: "Viewer"
};

export default function UsersPage() {
  const [rows, setRows] = useState<AppUser[]>(initialUsers);

  const updateRole = (id: string, role: UserRole) => {
    setRows((current) => current.map((user) => (user.id === id ? { ...user, role } : user)));
    toast.success("Role updated");
  };

  return (
    <AppShell title="Users & Roles" subtitle="Invite teammates, assign roles, and enforce CRUD permissions.">
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <CardHeader>
            <CardTitle>Invite User</CardTitle>
            <CardDescription>RBAC roles map to protected frontend routes and API permissions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Priya Shah" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="priya@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select className="w-full" defaultValue="VIEWER">
                {Object.entries(roleLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <Button onClick={() => toast.success("Invitation sent")}>
              <UserPlus />
              Send Invite
            </Button>
          </CardContent>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 place-items-center rounded-lg bg-primary/12 text-primary">
              <Shield />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Permission Matrix</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Badge variant="success">Super Admin: all modules</Badge>
                <Badge>Manager: operations + reports</Badge>
                <Badge variant="warning">Warehouse Staff: stock + orders</Badge>
                <Badge variant="secondary">Viewer: read-only</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Team Access</CardTitle>
          <CardDescription>Manage login status, role assignments, and audit ownership.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[780px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select value={user.role} onChange={(event) => updateRole(user.id, event.target.value as UserRole)}>
                      {Object.entries(roleLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "Active" ? "success" : "warning"}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Search, Shield, Trash2, UserPlus } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("VIEWER");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((u) => [u.name, u.email, u.role].join(" ").toLowerCase().includes(q));
  }, [searchQuery, rows]);

  const updateRole = (id: string, role: UserRole) => {
    setRows((current) => current.map((user) => (user.id === id ? { ...user, role } : user)));
    toast.success("Role updated");
  };

  const inviteUser = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Please enter name and email");
      return;
    }
    if (rows.some((u) => u.email === inviteEmail)) {
      toast.error("A user with this email already exists");
      return;
    }
    const newUser: AppUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      lastLogin: "Never",
      status: "Invited"
    };
    setRows((cur) => [...cur, newUser]);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("VIEWER");
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const toggleStatus = (id: string) => {
    setRows((cur) =>
      cur.map((u) => {
        if (u.id !== id) return u;
        const next = u.status === "Active" ? "Suspended" : "Active";
        toast.success(`${u.name} is now ${next}`);
        return { ...u, status: next as AppUser["status"] };
      })
    );
  };

  const deleteUser = (id: string) => {
    const u = rows.find((r) => r.id === id);
    setRows((cur) => cur.filter((r) => r.id !== id));
    toast.success(`${u?.name ?? "User"} removed`);
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
              <Input placeholder="Priya Shah" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="priya@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select className="w-full" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)}>
                {Object.entries(roleLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <Button onClick={inviteUser}>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Team Access</CardTitle>
              <CardDescription>Manage login status, role assignments, and audit ownership.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
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
                    <button type="button" onClick={() => toggleStatus(user.id)} className="cursor-pointer">
                      <Badge variant={user.status === "Active" ? "success" : user.status === "Invited" ? "secondary" : "warning"}>{user.status}</Badge>
                    </button>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users match your search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

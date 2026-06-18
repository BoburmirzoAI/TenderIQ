"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  Settings,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface TeamMember {
  id: number;
  user_id: number;
  role: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

interface Team {
  id: number;
  name: string;
  company_id: number;
  owner_id: number;
  max_members: number;
  members_count: number;
  members: TeamMember[];
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Egasi",
  admin: "Admin",
  member: "A'zo",
  viewer: "Ko'ruvchi",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800",
};

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Users,
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);

  const loadTeams = useCallback(async () => {
    try {
      const res = await api.get("/v1/teams/my");
      setTeams(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/v1/teams/", { name: newTeamName.trim() });
      setTeams((prev) => [res.data.data, ...prev]);
      setNewTeamName("");
      toast.success("Jamoa yaratildi!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    } finally {
      setCreating(false);
    }
  };

  const deleteTeam = async (teamId: number) => {
    if (!confirm("Jamoani o'chirishni xohlaysizmi?")) return;
    try {
      await api.delete(`/v1/teams/${teamId}`);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      if (selectedTeam?.id === teamId) setSelectedTeam(null);
      toast.success("Jamoa o'chirildi");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    }
  };

  const openTeam = async (teamId: number) => {
    try {
      const res = await api.get(`/v1/teams/${teamId}`);
      setSelectedTeam(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    }
  };

  const addMember = async () => {
    if (!selectedTeam || !memberEmail.trim()) return;
    setAddingMember(true);
    try {
      await api.post(`/v1/teams/${selectedTeam.id}/members`, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail("");
      setShowAddMember(false);
      await openTeam(selectedTeam.id);
      toast.success("A'zo qo'shildi!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    } finally {
      setAddingMember(false);
    }
  };

  const updateMemberRole = async (memberId: number, role: string) => {
    if (!selectedTeam) return;
    try {
      await api.patch(`/v1/teams/${selectedTeam.id}/members/${memberId}`, { role });
      await openTeam(selectedTeam.id);
      toast.success("Rol yangilandi");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    }
  };

  const removeMember = async (memberId: number) => {
    if (!selectedTeam) return;
    if (!confirm("A'zoni olib tashlashni xohlaysizmi?")) return;
    try {
      await api.delete(`/v1/teams/${selectedTeam.id}/members/${memberId}`);
      await openTeam(selectedTeam.id);
      toast.success("A'zo olib tashlandi");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTeam(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Orqaga
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedTeam.name}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedTeam.members_count} / {selectedTeam.max_members} a&apos;zo
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">A&apos;zolar</h2>
          <Button size="sm" onClick={() => setShowAddMember(!showAddMember)}>
            <UserPlus className="h-4 w-4 mr-1" /> A&apos;zo qo&apos;shish
          </Button>
        </div>

        {showAddMember && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    placeholder="user@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                  />
                </div>
                <div className="w-40">
                  <label className="text-sm font-medium mb-1 block">Rol</label>
                  <Select value={memberRole} onValueChange={setMemberRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">A&apos;zo</SelectItem>
                      <SelectItem value="viewer">Ko&apos;ruvchi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addMember} disabled={addingMember}>
                  {addingMember ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Qo'shish"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {selectedTeam.members.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role] || Users;
            return (
              <Card key={member.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <RoleIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.user_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === "owner" ? (
                      <Badge className={ROLE_COLORS[member.role]}>
                        <Crown className="h-3 w-3 mr-1" />
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    ) : (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(val) => updateMemberRole(member.id, val)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">A&apos;zo</SelectItem>
                            <SelectItem value="viewer">Ko&apos;ruvchi</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeMember(member.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jamoa</h1>
        <p className="text-muted-foreground">
          Jamoangizni boshqaring va a&apos;zolarni qo&apos;shing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Yangi jamoa yaratish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Jamoa nomi..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
              className="max-w-sm"
            />
            <Button onClick={createTeam} disabled={creating || !newTeamName.trim()}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Yaratish
            </Button>
          </div>
        </CardContent>
      </Card>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Hali jamoangiz yo&apos;q</p>
            <p className="text-sm mt-1">Yuqoridagi forma orqali yangi jamoa yarating</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openTeam(team.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTeam(team.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {team.members_count} / {team.max_members} a&apos;zo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {team.members.slice(0, 5).map((m) => (
                    <Badge
                      key={m.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {m.user_name || m.user_email}
                    </Badge>
                  ))}
                  {team.members_count > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{team.members_count - 5}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

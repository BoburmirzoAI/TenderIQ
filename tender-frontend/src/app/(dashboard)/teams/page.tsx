"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
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
  owner: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  admin: "bg-sky-400/10 text-sky-600 dark:text-sky-400",
  member: "bg-green-500/10 text-green-700 dark:text-green-400",
  viewer: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const ROLE_DOT_COLORS: Record<string, string> = {
  owner: "bg-yellow-500",
  admin: "bg-sky-400",
  member: "bg-green-500",
  viewer: "bg-gray-500",
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Xatolik");
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Xatolik");
    }
  };

  const openTeam = async (teamId: number) => {
    try {
      const res = await api.get(`/v1/teams/${teamId}`);
      setSelectedTeam(res.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Xatolik");
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Xatolik");
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Xatolik");
    }
  };

  const removeMember = async (memberId: number) => {
    if (!selectedTeam) return;
    if (!confirm("A'zoni olib tashlashni xohlaysizmi?")) return;
    try {
      await api.delete(`/v1/teams/${selectedTeam.id}/members/${memberId}`);
      await openTeam(selectedTeam.id);
      toast.success("A'zo olib tashlandi");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Xatolik");
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
          <button
            className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-3 py-2 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 inline-flex items-center gap-1"
            onClick={() => setSelectedTeam(null)}
          >
            <ArrowLeft className="h-4 w-4" /> Orqaga
          </button>
          <div>
            <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">{selectedTeam.name}</h1>
            <p className="text-[13px] text-muted-foreground">
              {selectedTeam.members_count} / {selectedTeam.max_members} a&apos;zo
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">A&apos;zolar</h2>
          <button
            className="rounded-full bg-[#1d1d1f] text-white px-5 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] inline-flex items-center gap-1.5"
            onClick={() => setShowAddMember(!showAddMember)}
          >
            <UserPlus className="h-4 w-4" /> A&apos;zo qo&apos;shish
          </button>
        </div>

        {showAddMember && (
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-[13px] font-medium mb-1.5 block">Email</label>
                <input
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  placeholder="user@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>
              <div className="w-40">
                <label className="text-[13px] font-medium mb-1.5 block">Rol</label>
                <Select value={memberRole} onValueChange={(v) => setMemberRole(v ?? "member")}>
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
              <button
                className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] disabled:opacity-50 disabled:cursor-not-allowed h-11"
                onClick={addMember}
                disabled={addingMember}
              >
                {addingMember ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Qo'shish"
                )}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {selectedTeam.members.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role] || Users;
            return (
              <div
                key={member.id}
                className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl px-5 py-3.5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <RoleIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-[13px]">{member.user_name}</p>
                    <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {member.user_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "owner" ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${ROLE_COLORS[member.role]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT_COLORS[member.role]}`} />
                      <Crown className="h-3 w-3" />
                      {ROLE_LABELS[member.role]}
                    </span>
                  ) : (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(val) => val && updateMemberRole(member.id, val)}
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
                      <button
                        className="rounded-xl border border-red-200/50 bg-red-50/50 backdrop-blur px-2.5 py-1.5 text-red-500 transition-all hover:bg-red-100 hover:text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                        onClick={() => removeMember(member.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Jamoa</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Jamoangizni boshqaring va a&apos;zolarni qo&apos;shing
        </p>
      </div>

      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <h3 className="text-[13px] font-semibold mb-3">Yangi jamoa yaratish</h3>
        <div className="flex gap-3">
          <input
            className="flex-1 h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
            placeholder="Jamoa nomi..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTeam()}
          />
          <button
            className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            onClick={createTeam}
            disabled={creating || !newTeamName.trim()}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Yaratish
          </button>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-12 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Hali jamoangiz yo&apos;q</p>
          <p className="text-[14px] text-muted-foreground mt-1">Yuqoridagi forma orqali yangi jamoa yarating</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer group"
              onClick={() => openTeam(team.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[15px] font-semibold group-hover:text-sky-500 dark:hover:text-sky-400 dark:group-hover:text-sky-400 transition-colors">{team.name}</h3>
                <button
                  className="rounded-xl border border-red-200/50 bg-red-50/50 backdrop-blur px-2 py-1.5 text-red-500 transition-all hover:bg-red-100 hover:text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTeam(team.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3">
                {team.members_count} / {team.max_members} a&apos;zo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {team.members.slice(0, 5).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/5"
                  >
                    {m.user_name || m.user_email}
                  </span>
                ))}
                {team.members_count > 5 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold bg-sky-400/10 text-sky-500 dark:text-sky-400">
                    +{team.members_count - 5}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

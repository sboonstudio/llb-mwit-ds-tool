"use client";

import { Role } from "@prisma/client";
import { updateUserRole, deleteUser, adminResetPassword } from "@/actions/admin";
import { useState, useMemo } from "react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: Date | string;
  _count: {
    activityLogs: number;
  };
  resourceUsage: {
    cpuUsage: number;
    memoryUsage: number;
    recordedAt: Date;
  }[];
};

export default function UserTable({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");

  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert("Failed to update role");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    
    try {
      const result = await adminResetPassword(userId, newPassword);
      if (result?.success) {
        alert("Password has been reset successfully");
        setResettingUserId(null);
        setNewPassword("");
        setShowResetPassword(false);
      } else {
        alert(result?.error || "Failed to reset password");
      }
    } catch (error) {
      alert("Failed to reset password");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        (user.name?.toLowerCase().includes(searchLower) || false) || 
        (user.email?.toLowerCase().includes(searchLower) || false) ||
        user.id.toLowerCase().includes(searchLower);
      
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 focus:border-indigo-500 focus:outline-none shadow-sm"
          >
            <option value="ALL">ALL ROLES</option>
            <option value="ADMIN">ADMIN</option>
            <option value="COACH">COACH</option>
            <option value="STUDENT">STUDENT</option>
            <option value="GUEST">GUEST</option>
          </select>
          <div className="h-8 w-px bg-slate-100 hidden md:block mx-1"></div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            {filteredUsers.length} USERS
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Identity</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Resource Usage</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Stats</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Joined</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900">{user.name || "No Name"}</div>
                  <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-mono bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">
                      ID: {user.id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className="block w-full rounded-md border-slate-200 bg-slate-50/50 py-1 text-xs font-semibold shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="COACH">COACH</option>
                    <option value="STUDENT">STUDENT</option>
                    <option value="GUEST">GUEST</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  {user.resourceUsage && user.resourceUsage.length > 0 ? (
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">CPU:</span>
                        <span className="font-bold text-slate-700">{user.resourceUsage[0].cpuUsage.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">RAM:</span>
                        <span className="font-bold text-slate-700">{user.resourceUsage[0].memoryUsage.toFixed(0)} MB</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 italic">No metrics</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full">{user._count.activityLogs} activities</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  {resettingUserId === user.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <div className="relative">
                        <input
                          type={showResetPassword ? "text" : "password"}
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-32 rounded-lg border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:bg-white outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-indigo-600"
                        >
                          {showResetPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700 shadow-sm transition-all"
                      >
                        SAVE
                      </button>
                      <button
                        onClick={() => {
                          setResettingUserId(null);
                          setNewPassword("");
                          setShowResetPassword(false);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2"
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setResettingUserId(user.id)}
                        className="rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 transition-all"
                      >
                        RESET PASSWORD
                      </button>
                      {currentUserId !== user.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="rounded border border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all"
                        >
                          DELETE
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400 italic bg-slate-50/30">
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

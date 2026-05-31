"use client";

import { Role } from "@prisma/client";
import { updateUserRole, deleteUser, adminResetPassword } from "@/actions/admin";
import { useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: Date | string;
  _count: {
    activityLogs: number;
  };
};

export default function UserTable({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);

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

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Stats</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Joined</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-slate-900">{user.name || "No Name"}</div>
                <div className="text-sm text-slate-500">{user.email}</div>
              </td>
              <td className="px-6 py-4">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                  className="block w-full rounded-md border-slate-300 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="COACH">COACH</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="GUEST">GUEST</option>
                </select>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {user._count.activityLogs} activities
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
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
                        className="w-32 rounded-md border-slate-300 px-2 py-1 text-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-1 top-1 text-[10px] text-slate-400"
                      >
                        {showResetPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setResettingUserId(null);
                        setNewPassword("");
                        setShowResetPassword(false);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-x-3">
                    <button
                      onClick={() => setResettingUserId(user.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Reset Password
                    </button>
                    {currentUserId !== user.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  User, 
  ChevronRight, 
  Shield, 
  UserCircle, 
  Search,
  Mail,
  Clock,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface UserData {
  id: string;
  email: string;
  role: "admin" | "member";
  lastSeen?: string;
  updatedAt?: string;
}

export default function AdminUsers() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const isAdmin = role === "admin" || user?.email?.toLowerCase() === "georgeghobrial97@gmail.com";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    try {
      return format(new Date(dateStr), "MMM d, yyyy HH:mm");
    } catch (e) {
      return dateStr;
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="User Management" 
        subtitle="View and manage roles for all registered users."
      />

      <Input
        icon={Search}
        placeholder="Search users by email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="py-4 rounded-2xl"
      />

      <Card padding="none" className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12">
                    <LoadingSpinner text="Loading users..." />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 italic">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <UserCircle className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-neutral-900 break-all">{u.email}</span>
                          <span className="text-[10px] text-neutral-400 font-mono truncate">{u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={u.role === "admin" ? "admin" : "default"}
                        showIcon={u.role === "admin"}
                      >
                        {u.role === "admin" ? "Admin" : "Member"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(u.lastSeen)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-neutral-100">
          {loading ? (
            <div className="px-6 py-12">
              <LoadingSpinner text="Loading users..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500 italic">
              No users found matching your search.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <Link
                key={u.id}
                to={`/admin/users/${u.id}`}
                className="block p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <UserCircle className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-neutral-900 break-all">{u.email}</span>
                      <Badge 
                        variant={u.role === "admin" ? "admin" : "default"}
                        showIcon={u.role === "admin"}
                        className="mt-1 w-fit"
                      >
                        {u.role === "admin" ? "Admin" : "Member"}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-300" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last Seen: {formatDate(u.lastSeen)}
                  </div>
                  <span className="font-mono">{u.id.slice(0, 8)}...</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

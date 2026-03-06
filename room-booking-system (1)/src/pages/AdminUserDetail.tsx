import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  UserCircle, 
  Shield, 
  Mail, 
  Clock, 
  Calendar, 
  MapPin, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface UserData {
  id: string;
  email: string;
  role: "admin" | "member";
  lastSeen?: string;
  updatedAt?: string;
}

interface BookingRequest {
  id: string;
  roomId: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "denied";
  createdAt: any;
}

export default function AdminUserDetail() {
  const { user: currentUser, role: currentRole } = useAuth();
  const { id } = useParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isAdmin = currentRole === "admin" || currentUser?.email?.toLowerCase() === "georgeghobrial97@gmail.com";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchUserDetail();
  }, [id, isAdmin]);

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      const data = await response.json();
      setUserData(data.user);
      setRequests(data.requests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (newRole: "admin" | "member") => {
    if (!userData) return;
    if (userData.email.toLowerCase() === "georgeghobrial97@gmail.com") {
      alert("Cannot change the primary admin's role.");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userData.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (!response.ok) throw new Error("Failed to update role");
      setUserData({ ...userData, role: newRole });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading user details..." />;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!userData) return <div className="text-center py-12">User not found</div>;

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        onClick={() => navigate(-1)}
      >
        Back to Users
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center" padding="lg">
            <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
              <UserCircle className="w-16 h-16" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1 break-all">{userData.email}</h2>
            <p className="text-xs text-neutral-400 font-mono mb-6">{userData.id}</p>
            
            <div className="flex justify-center mb-8">
              <Badge 
                variant={userData.role === "admin" ? "admin" : "default"}
                showIcon={userData.role === "admin"}
                className="px-3 py-1 text-xs"
              >
                {userData.role === "admin" ? "Administrator" : "Member"}
              </Badge>
            </div>

            <div className="space-y-4 pt-6 border-t border-neutral-100 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">{userData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Last seen: {userData.lastSeen ? format(new Date(userData.lastSeen), "PPP") : "Never"}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              Manage Permissions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleRoleUpdate("admin")}
                disabled={updating || userData.role === "admin"}
                className={cn(
                  "w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between",
                  userData.role === "admin" 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 cursor-default" 
                    : "bg-white text-neutral-600 border border-neutral-200 hover:border-indigo-500 hover:text-indigo-600"
                )}
              >
                Make Admin
                {userData.role === "admin" && <CheckCircle2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleRoleUpdate("member")}
                disabled={updating || userData.role === "member"}
                className={cn(
                  "w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between",
                  userData.role === "member" 
                    ? "bg-neutral-50 text-neutral-500 border border-neutral-200 cursor-default" 
                    : "bg-white text-neutral-600 border border-neutral-200 hover:border-red-500 hover:text-red-600"
                )}
              >
                Revoke Admin
                {userData.role === "member" && <CheckCircle2 className="h-4 w-4" />}
              </button>
            </div>
            {userData.email.toLowerCase() === "georgeghobrial97@gmail.com" && (
              <p className="mt-4 text-[10px] text-amber-600 font-medium leading-relaxed">
                * This is the primary administrator account and its role cannot be modified.
              </p>
            )}
          </Card>
        </div>

        {/* User Bookings List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-neutral-900">Booking History</h3>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full">
              {requests.length} Total
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center">
              <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-neutral-900">No bookings found</h4>
              <p className="text-neutral-500">This user hasn't made any booking requests yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  to={`/admin/requests/${req.id}`}
                >
                  <Card className="hover:shadow-md transition-all group" padding="md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                      </div>
                      <Badge variant={req.status} showIcon>
                        {req.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold text-neutral-900">{req.roomId}</h4>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{req.eventType}</p>
                    </div>

                    <div className="space-y-2 text-xs text-neutral-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(req.date), "PPP")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {req.startTime} - {req.endTime}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, User, ChevronRight, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import SetupGuide from "../components/SetupGuide";

interface BookingRequest {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "denied";
  userEmail: string;
  createdAt: any;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "denied">("pending");

  useEffect(() => {
    if (!user) return;

    const fetchAllRequests = async () => {
      try {
        const response = await fetch("/api/requests/all");
        if (!response.ok) throw new Error("Failed to fetch all requests");
        const data = await response.json();
        setRequests(data);
        setError(null);
      } catch (err: any) {
        console.error("AdminDashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRequests();
    
    // Optional: Poll every 30 seconds for updates
    const interval = setInterval(fetchAllRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredRequests = requests.filter(r => r.status === activeTab);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, "MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return (
    <LoadingSpinner text="Loading dashboard..." className="py-24" />
  );

  if (error) {
    if (error.includes("permissions")) {
      return <SetupGuide error={error} />;
    }
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-700 text-sm mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Approvals" 
        subtitle="Manage all room booking requests across the organization."
      />

      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(["pending", "approved", "denied"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={cn(
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold capitalize transition-all",
                activeTab === status 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
              )}
              aria-current={activeTab === status ? 'page' : undefined}
            >
              {status}
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === status 
                  ? "bg-indigo-100 text-indigo-600" 
                  : "bg-neutral-100 text-neutral-500"
              )}>
                {requests.filter(r => r.status === status).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <Card padding="none" className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 italic">
                    No {activeTab} requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{request.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        {request.roomId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-neutral-900 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          {formatDate(request.date)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          {request.startTime} - {request.endTime}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={request.status} showIcon>
                        {request.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/requests/${request.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                      >
                        {activeTab === "pending" ? "Review" : "View Details"}
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
          {filteredRequests.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-500 italic">
              No {activeTab} requests found.
            </div>
          ) : (
            filteredRequests.map((request) => (
              <Link
                key={request.id}
                to={`/admin/requests/${request.id}`}
                className="block p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <User className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium text-neutral-900 truncate max-w-[150px]">{request.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={request.status} showIcon>
                      {request.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {request.roomId}
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(request.date)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {request.startTime} - {request.endTime}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-end text-xs font-bold text-indigo-600">
                  {activeTab === "pending" ? "Review Request" : "View Details"}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

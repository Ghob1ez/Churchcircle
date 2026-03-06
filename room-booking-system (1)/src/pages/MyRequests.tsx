import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, XCircle, Clock3, Shield } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import SetupGuide from "../components/SetupGuide";

interface BookingRequest {
  id: string;
  roomId: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "denied";
  adminNote?: string;
  createdAt: any;
}

export default function MyRequests() {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      try {
        const response = await fetch(`/api/requests/my?userId=${user.uid}`);
        if (!response.ok) throw new Error("Failed to fetch requests");
        const data = await response.json();
        setRequests(data);
        setError(null);
      } catch (err: any) {
        console.error("MyRequests fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "denied": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock3 className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize";
    switch (status) {
      case "approved": return `${base} bg-emerald-50 text-emerald-700 border border-emerald-100`;
      case "denied": return `${base} bg-red-50 text-red-700 border border-red-100`;
      default: return `${base} bg-amber-50 text-amber-700 border border-amber-100`;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, "PPP");
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      <p className="text-neutral-500 font-medium">Loading your requests...</p>
    </div>
  );

  if (error) {
    if (error.includes("permissions")) {
      return <SetupGuide error={error} />;
    }
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Requests</h3>
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
    <div className="space-y-6">
      {user && (role === "admin" || user.email?.toLowerCase() === "georgeghobrial97@gmail.com") && (
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Admin Privileges Active</h2>
              <p className="text-indigo-100 text-sm">You have full access to manage all booking requests.</p>
            </div>
          </div>
          <Link 
            to="/admin" 
            className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            Go to Approvals
          </Link>
        </div>
      )}

      <PageHeader 
        title="My Booking Requests" 
        subtitle="View and track the status of your room booking requests."
        action={
          <Link 
            to="/request" 
            className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95"
          >
            New Booking
          </Link>
        }
      />

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center">
          <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900">No requests yet</h3>
          <p className="text-neutral-500">Your booking requests will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Link 
              key={request.id} 
              to={`/my-requests/${request.id}`}
              className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={getStatusBadge(request.status)}>{request.status}</span>
                  {getStatusIcon(request.status)}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-neutral-900">{request.roomId}</h3>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-1">{request.eventType || "Other"}</p>
              </div>
              
              <div className="space-y-2 text-sm text-neutral-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(request.date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {request.startTime} - {request.endTime}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 group-hover:underline">View Details</span>
                {request.adminNote && (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

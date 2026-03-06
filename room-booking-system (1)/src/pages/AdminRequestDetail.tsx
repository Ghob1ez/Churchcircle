import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle, AlertCircle, ArrowLeft, MessageSquare, Info } from "lucide-react";
import { format } from "date-fns";
import SetupGuide from "../components/SetupGuide";

interface BookingRequest {
  id: string;
  roomId: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "denied";
  userEmail: string;
  userId: string;
  adminNote?: string;
  createdAt: any;
}

export default function AdminRequestDetail() {
  const { user, role } = useAuth();
  const { id } = useParams();
  const [request, setRequest] = useState<BookingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isAdmin = role === "admin" || user?.email?.toLowerCase() === "georgeghobrial97@gmail.com";

  useEffect(() => {
    if (!id || !user) return;

    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/requests/detail/${id}`);
        if (!response.ok) throw new Error("Failed to fetch request details");
        const data = await response.json();
        
        // Security check: if not admin, must be the owner
        if (!isAdmin && data.userId !== user.uid) {
          throw new Error("You do not have permission to view this request");
        }

        setRequest(data);
        setError("");
      } catch (err: any) {
        console.error("AdminRequestDetail fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, user, isAdmin]);

  const handleApprove = async () => {
    if (!request || !user || !isAdmin) return;
    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          adminId: user.uid
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to approve");
      
      navigate("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!request || !user || !isAdmin) return;
    if (!adminNote) {
      setError("Please provide a reason for denial");
      return;
    }
    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/requests/deny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          adminNote,
          adminId: user.uid
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to deny");
      
      navigate("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!request || !user) return;
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
    
    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/requests/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          userId: user.uid
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to cancel");
      
      navigate("/my-requests");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, "PPPP");
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading request details...</div>;
  
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Error</h3>
        <p className="text-red-700 text-sm mb-6">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!request) return <div className="text-center py-12">Request not found</div>;

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Booking Details</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              request.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              request.status === "denied" ? "bg-red-50 text-red-700 border-red-100" :
              "bg-amber-50 text-amber-700 border-amber-100"
            }`}>
              {request.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-neutral-100 rounded-xl">
                  <User className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Requested By</p>
                  <p className="text-neutral-900 font-medium break-all">{request.userEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-neutral-100 rounded-xl">
                  <MapPin className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Room</p>
                  <p className="text-neutral-900 font-medium">{request.roomId}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-neutral-100 rounded-xl">
                  <Info className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Event Type</p>
                  <p className="text-neutral-900 font-medium">{request.eventType || "Other"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-neutral-100 rounded-xl">
                  <Calendar className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-neutral-900 font-medium">{formatDate(request.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-neutral-100 rounded-xl">
                  <Clock className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Time Slot</p>
                  <p className="text-neutral-900 font-medium">{request.startTime} - {request.endTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {request.adminNote && (
          <div className="p-8 bg-neutral-50/50 border-b border-neutral-100">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Admin Feedback</p>
            <p className="text-neutral-700 italic">"{request.adminNote}"</p>
          </div>
        )}

        {isAdmin && request.status === "pending" && (
          <div className="p-8 bg-neutral-50/50 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-neutral-400" />
                Admin Note (Required for denial)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Provide feedback or reason for denial..."
                className="w-full h-32 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition-all focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-5 w-5" />
                {processing ? "Processing..." : "Approve Request"}
              </button>
              <button
                onClick={handleDeny}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3.5 rounded-2xl hover:bg-red-700 transition-all focus:ring-4 focus:ring-red-500/30 disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                <XCircle className="h-5 w-5" />
                {processing ? "Processing..." : "Deny Request"}
              </button>
            </div>
          </div>
        )}

        {!isAdmin && request.userId === user?.uid && (
          <div className="p-8 bg-neutral-50/50">
            <button
              onClick={handleCancel}
              disabled={processing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-red-50 transition-all focus:ring-4 focus:ring-red-500/10 disabled:opacity-50"
            >
              <XCircle className="h-5 w-5" />
              {processing ? "Processing..." : "Cancel Request"}
            </button>
            <p className="mt-4 text-xs text-neutral-500">
              Cancelling a request will remove it permanently. If the request was already approved, the booking will also be removed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

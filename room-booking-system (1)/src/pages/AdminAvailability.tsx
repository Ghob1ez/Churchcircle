import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  AlertCircle, 
  ShieldAlert,
  Info,
  CheckCircle2,
  Repeat,
  CalendarDays,
  Edit2,
  X,
  MoreVertical,
  Eye
} from "lucide-react";
import { format, parseISO, isBefore, addDays, addWeeks, addMonths, differenceInCalendarDays, differenceInCalendarWeeks, differenceInCalendarMonths } from "date-fns";
import { cn } from "../lib/utils";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Dropdown } from "../components/ui/Dropdown";
import { Badge } from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Modal } from "../components/ui/Modal";

const ROOMS = [
  "All Rooms",
  "Arabic Church", 
  "English Church", 
  "Outdoor area (Near english church)", 
  "Upstairs room (Near arabic church)"
];

interface AvailabilityBlock {
  id: string;
  roomId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  interval?: number;
  days?: number[];
  recurrenceEndDate?: string;
  createdAt: any;
}

const DAYS_OF_WEEK = [
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
  { label: "S", value: 0 },
];

export default function AdminAvailability() {
  const { user, role } = useAuth();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Form state
  const [roomId, setRoomId] = useState(ROOMS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [reason, setReason] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [interval, setIntervalValue] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [isSeries, setIsSeries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);
  const [viewingBlock, setViewingBlock] = useState<AvailabilityBlock | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isAdmin = role === "admin" || user?.email?.toLowerCase() === "georgeghobrial97@gmail.com";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchBlocks();
  }, [isAdmin]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const fetchBlocks = async () => {
    try {
      const response = await fetch("/api/admin/availability/blocks");
      if (response.ok) {
        const data = await response.json();
        setBlocks(data);
      }
    } catch (err) {
      console.error("Failed to fetch blocks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      setError("Start date is required");
      return;
    }

    if (!isSeries && !endDate) {
      setError("End date is required for one-time events");
      return;
    }

    if (isSeries && !recurrenceEndDate) {
      setError("Recurrence end date is required for series");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url = editingBlock 
        ? `/api/admin/availability/block/${editingBlock.id}`
        : "/api/admin/availability/block";
      
      const response = await fetch(url, {
        method: editingBlock ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          startDate,
          endDate: isSeries ? recurrenceEndDate : endDate,
          startTime,
          endTime,
          reason,
          recurrence: isSeries ? recurrence : "none",
          interval,
          days: selectedDays,
          recurrenceEndDate: isSeries ? recurrenceEndDate : null,
          adminId: user?.uid
        })
      });

      if (!response.ok) throw new Error(`Failed to ${editingBlock ? "update" : "create"} block`);
      
      setSuccess(`Availability block ${editingBlock ? "updated" : "created"} successfully`);
      setIsEditModalOpen(false);
      resetForm();
      fetchBlocks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRoomId(ROOMS[0]);
    setStartDate("");
    setEndDate("");
    setReason("");
    setRecurrence("none");
    setIntervalValue(1);
    setSelectedDays([]);
    setRecurrenceEndDate("");
    setIsSeries(false);
    setEditingBlock(null);
    setViewingBlock(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (block: AvailabilityBlock) => {
    setEditingBlock(block);
    setViewingBlock(null);
    setRoomId(block.roomId);
    setStartDate(block.startDate);
    setEndDate(block.endDate);
    setStartTime(block.startTime);
    setEndTime(block.endTime);
    setReason(block.reason);
    setRecurrence(block.recurrence);
    setIntervalValue(block.interval || 1);
    setSelectedDays(block.days || []);
    setRecurrenceEndDate(block.recurrenceEndDate || "");
    setIsSeries(block.recurrence !== "none");
    setIsEditModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setBlockToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!blockToDelete) return;

    try {
      const response = await fetch(`/api/admin/availability/block/${blockToDelete}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setBlocks(prev => prev.filter(b => b.id !== blockToDelete));
        setIsDeleteModalOpen(false);
        setBlockToDelete(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete block");
      }
    } catch (err) {
      console.error("Failed to delete block", err);
      setError("An error occurred while deleting the block");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Manage Availability" 
        subtitle="Block out specific dates and times for church rooms."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Block Form */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                Create New Block
              </h2>
            </div>

            <div className="flex p-1 bg-neutral-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setIsSeries(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
                  !isSeries ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                Event
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSeries(true);
                  if (recurrence === "none") setRecurrence("weekly");
                  // Set default Until date to 6 months from now if not set
                  if (!recurrenceEndDate) {
                    const sixMonthsLater = addMonths(startDate ? parseISO(startDate) : new Date(), 6);
                    setRecurrenceEndDate(format(sixMonthsLater, "yyyy-MM-dd"));
                  }
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
                  isSeries ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <Repeat className="h-4 w-4" />
                Series
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Room"
                icon={MapPin}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                options={ROOMS}
              />

              <Input
                label="Start Date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                icon={Calendar}
              />

              {!isSeries && (
                <Input
                  label="End Date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  icon={Calendar}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  icon={Clock}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  icon={Clock}
                />
              </div>

              {isSeries && (
                <div className="space-y-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Every"
                      type="number"
                      min="1"
                      value={interval}
                      onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                    />
                    <Select
                      label="Recurrence"
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value as any)}
                      options={[
                        { label: "Day(s)", value: "daily" },
                        { label: "Week(s)", value: "weekly" },
                        { label: "Month(s)", value: "monthly" }
                      ]}
                    />
                  </div>

                  {recurrence === "weekly" && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">On days</label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={cn(
                              "w-8 h-8 rounded-full text-xs font-bold transition-all",
                              selectedDays.includes(day.value)
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300"
                            )}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Until</label>
                    <input
                      type="date"
                      required
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Christian Fasting Period"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {success}
                </div>
              )}

              <Button
                type="submit"
                loading={submitting}
                className="w-full py-4"
                icon={Plus}
              >
                Create Block
              </Button>
            </form>
          </Card>
        </div>

        {/* List of Blocks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Active Blocks</h2>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full">
              {blocks.length} Total
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <LoadingSpinner text="Loading availability blocks..." />
            ) : blocks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center">
                <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-neutral-900">No blocks found</h3>
                <p className="text-neutral-500">All rooms are currently available based on standard rules.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blocks.map((block) => (
                  <Card key={block.id} padding="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="p-2 bg-indigo-50 rounded-xl">
                            <MapPin className="h-4 w-4 text-indigo-600" />
                          </div>
                          <h3 className="font-bold text-neutral-900">{block.roomId}</h3>
                          {block.recurrence && block.recurrence !== "none" && (
                            <Badge variant="pending" className="bg-amber-50 text-amber-700 border-amber-100">
                              <Repeat className="h-2.5 w-2.5 mr-1" />
                              {block.recurrence}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Calendar className="h-4 w-4 text-neutral-400" />
                            <span className="font-medium">
                              {block.recurrence === "none"
                                ? (block.startDate === block.endDate 
                                    ? format(new Date(block.startDate), "PPP")
                                    : `${format(new Date(block.startDate), "PP")} - ${format(new Date(block.endDate), "PP")}`)
                                : `Starts ${format(new Date(block.startDate), "PP")} until ${format(new Date(block.endDate), "PP")}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Clock className="h-4 w-4 text-neutral-400" />
                            <span className="font-medium">{block.startTime} - {block.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Info className="h-4 w-4 text-neutral-400" />
                            <span className="font-medium">{block.reason}</span>
                          </div>
                        </div>

                        {block.recurrence === "weekly" && block.days && block.days.length > 0 && (
                          <div className="flex gap-1">
                            {DAYS_OF_WEEK.map(d => (
                              <span key={d.value} className={cn(
                                "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full",
                                block.days?.includes(d.value) ? "bg-indigo-100 text-indigo-700" : "text-neutral-300"
                              )}>
                                {d.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Dropdown
                          items={[
                            { label: "View Details", onClick: () => setViewingBlock(block), icon: Eye },
                            { label: "Edit Block", onClick: () => handleEdit(block), icon: Edit2 },
                            { label: "Delete Block", onClick: () => confirmDelete(block.id), icon: Trash2, variant: "danger" }
                          ]}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!viewingBlock}
        onClose={() => setViewingBlock(null)}
        title="Block Details"
        footer={
          <Button onClick={() => setViewingBlock(null)}>
            Close
          </Button>
        }
      >
        {viewingBlock && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Room</h4>
                <p className="text-lg font-bold text-neutral-900">{viewingBlock.roomId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Start</h4>
                <div className="flex items-center gap-2 text-neutral-900 font-bold">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  {format(parseISO(viewingBlock.startDate), "PPP")}
                </div>
                <div className="flex items-center gap-2 text-neutral-600 text-sm mt-1">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  {viewingBlock.startTime}
                </div>
              </div>
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">End</h4>
                <div className="flex items-center gap-2 text-neutral-900 font-bold">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  {format(parseISO(viewingBlock.endDate), "PPP")}
                </div>
                <div className="flex items-center gap-2 text-neutral-600 text-sm mt-1">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  {viewingBlock.endTime}
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Reason / Note</h4>
              <p className="text-neutral-700 font-medium">{viewingBlock.reason || "No reason provided"}</p>
            </div>

            {viewingBlock.recurrence !== "none" && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Repeat className="h-3 w-3" /> Recurrence Pattern
                </h4>
                <p className="text-amber-900 font-bold">
                  Every {viewingBlock.interval} {viewingBlock.recurrence}(s)
                </p>
                {viewingBlock.recurrence === "weekly" && viewingBlock.days && viewingBlock.days.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {DAYS_OF_WEEK.map(d => (
                      <span key={d.value} className={cn(
                        "text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full",
                        viewingBlock.days?.includes(d.value) ? "bg-amber-200 text-amber-900" : "text-amber-200 opacity-50"
                      )}>
                        {d.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="Edit Availability Block"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          <div className="flex p-1 bg-neutral-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setIsSeries(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
                !isSeries ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Event
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSeries(true);
                if (recurrence === "none") setRecurrence("weekly");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
                isSeries ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Repeat className="h-4 w-4" />
              Series
            </button>
          </div>

          <Select
            label="Room"
            icon={MapPin}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={ROOMS}
          />

          <Input
            label="Start Date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            icon={Calendar}
          />

          {!isSeries && (
            <Input
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              icon={Calendar}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              icon={Clock}
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              icon={Clock}
            />
          </div>

          {isSeries && (
            <div className="space-y-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Every"
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                />
                <Select
                  label="Recurrence"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as any)}
                  options={[
                    { label: "Day(s)", value: "daily" },
                    { label: "Week(s)", value: "weekly" },
                    { label: "Month(s)", value: "monthly" }
                  ]}
                />
              </div>

              {recurrence === "weekly" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">On days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          "w-8 h-8 rounded-full text-xs font-bold transition-all",
                          selectedDays.includes(day.value)
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Input
                label="Until"
                type="date"
                required
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                icon={Calendar}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700">Reason / Note</label>
            <input
              type="text"
              placeholder="e.g. Christian Fasting Period"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          <Button
            type="submit"
            loading={submitting}
            className="w-full py-4"
            icon={Edit2}
          >
            Update Block
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Block
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Are you sure you want to delete this block?</p>
              <p className="text-xs text-red-700 mt-1">This action cannot be undone. The room(s) will become available for booking during this period again.</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

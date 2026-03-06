import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, MapPin, Send, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore, 
  startOfToday,
  parseISO,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths
} from "date-fns";
import { cn } from "../lib/utils";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

const ROOMS = [
  "Arabic Church", 
  "English Church", 
  "Outdoor area (Near english church)", 
  "Upstairs room (Near arabic church)"
];

const EVENT_TYPES = ["Wedding", "Engagement", "Baptism", "Meeting", "Other"];

interface CalendarItem {
  id: string;
  type: "booking" | "block";
  date?: string; // for bookings
  startDate?: string; // for blocks
  endDate?: string; // for blocks
  roomId: string;
  startTime: string;
  endTime: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  interval?: number;
  days?: number[];
}

export default function RequestBooking() {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState(ROOMS[0]);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch("/api/bookings/calendar");
        if (response.ok) {
          const data = await response.json();
          setCalendarItems(data);
        }
      } catch (err) {
        console.error("Failed to fetch calendar", err);
      }
    };
    fetchCalendar();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!date) {
      setError("Please select a date from the calendar");
      return;
    }
    
    setLoading(true);
    setError("");

    if (startTime >= endTime) {
      setError("End time must be after start time");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          roomId,
          eventType,
          date,
          startTime,
          endTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit request");

      navigate("/my-requests");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDateUnavailable = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    
    return calendarItems.some(item => {
      if (item.roomId !== "All Rooms" && item.roomId !== roomId) return false;

      if (item.type === "booking") {
        return item.date === dateStr;
      } else if (item.type === "block") {
        const start = parseISO(item.startDate!);
        const end = parseISO(item.endDate!);
        
        if (isBefore(day, start) || isBefore(end, day)) return false;

        if (!item.recurrence || item.recurrence === "none") {
          return dateStr >= item.startDate! && dateStr <= item.endDate!;
        }

        const interval = item.interval || 1;

        if (item.recurrence === "daily") {
          const diff = differenceInCalendarDays(day, start);
          return diff % interval === 0;
        }

        if (item.recurrence === "weekly") {
          const diff = differenceInCalendarWeeks(day, start);
          if (diff % interval !== 0) return false;
          if (item.days && item.days.length > 0) {
            return item.days.includes(day.getDay());
          }
          return day.getDay() === start.getDay();
        }

        if (item.recurrence === "monthly") {
          const diff = differenceInCalendarMonths(day, start);
          if (diff % interval !== 0) return false;
          return day.getDate() === start.getDate();
        }
      }
      return false;
    });
  };

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const items = calendarItems.filter(item => {
      if (item.roomId !== "All Rooms" && item.roomId !== roomId) return false;
      
      if (item.type === "booking") return item.date === dateStr;
      
      const start = parseISO(item.startDate!);
      const end = parseISO(item.endDate!);
      if (isBefore(day, start) || isBefore(end, day)) return false;

      if (!item.recurrence || item.recurrence === "none") {
        return dateStr >= item.startDate! && dateStr <= item.endDate!;
      }
      
      const interval = item.interval || 1;

      if (item.recurrence === "daily") {
        const diff = differenceInCalendarDays(day, start);
        return diff % interval === 0;
      }
      if (item.recurrence === "weekly") {
        const diff = differenceInCalendarWeeks(day, start);
        if (diff % interval !== 0) return false;
        if (item.days && item.days.length > 0) {
          return item.days.includes(day.getDay());
        }
        return day.getDay() === start.getDay();
      }
      if (item.recurrence === "monthly") {
        const diff = differenceInCalendarMonths(day, start);
        if (diff % interval !== 0) return false;
        return day.getDate() === start.getDate();
      }
      
      return false;
    });

    if (items.some(i => i.type === "block")) return "blocked";
    if (items.some(i => i.type === "booking")) return "booked";
    return "available";
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-100">
        <span className="text-lg font-bold text-neutral-900">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-neutral-600" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 border-b border-neutral-100">
        {days.map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const isSelected = date && isSameDay(day, parseISO(date));
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isPast = isBefore(day, startOfToday());
        const status = getDayStatus(day);
        const isDisabled = isPast || status !== "available";

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isDisabled}
            onClick={() => setDate(format(cloneDay, "yyyy-MM-dd"))}
            className={cn(
              "relative h-14 sm:h-20 border-r border-b border-neutral-100 flex flex-col items-center justify-center transition-all",
              !isCurrentMonth && "bg-neutral-50/50 text-neutral-300",
              isSelected && "bg-indigo-50 text-indigo-600 font-bold z-10",
              isDisabled && !isSelected && "bg-neutral-50 text-neutral-300 cursor-not-allowed",
              !isDisabled && !isSelected && "hover:bg-neutral-50 text-neutral-700"
            )}
          >
            <span className={cn(
              "text-sm",
              isSelected && "scale-110"
            )}>
              {formattedDate}
            </span>
            {status !== "available" && isCurrentMonth && (
              <span className={cn(
                "absolute bottom-2 px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-tighter",
                status === "blocked" ? "bg-neutral-200 text-neutral-600" : "bg-red-100 text-red-600"
              )}>
                {status === "blocked" ? "Blocked" : "Booked"}
              </span>
            )}
            {isSelected && (
              <div className="absolute top-1 right-1">
                <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full" />
              </div>
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body">{rows}</div>;
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="New Booking" 
        subtitle="Select a room and date to request your event booking."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar: Top on mobile, right on desktop */}
        <div className="lg:col-span-2 lg:order-last">
          <Card padding="none" className="overflow-hidden">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </Card>
          <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white border border-neutral-200" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-50 border border-neutral-100" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-100" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-100" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Selected</span>
            </div>
          </div>
        </div>

        {/* Form Controls: Bottom on mobile, left on desktop */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="space-y-6">
            <Select
              label="Select Room"
              icon={MapPin}
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
                setDate("");
              }}
              options={ROOMS}
            />

            <Select
              label="Event Type"
              icon={Info}
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              options={EVENT_TYPES}
            />

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

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-medium">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!date}
              className="w-full py-4"
              icon={Send}
            >
              Submit Booking
            </Button>
          </Card>
          
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
            <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" /> Booking Policy
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              All bookings are subject to approval by the administration. Please allow up to 24 hours for a response. Approved bookings will be visible on the public calendar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

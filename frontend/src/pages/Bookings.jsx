import { useEffect, useState } from "react";
import { authFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

function StatusBadge({ status }) {
  const map = {
    PENDING: "badge-pending",
    APPROVED: "badge-approved",
    REJECTED: "badge-rejected",
    CANCELLED: "badge-cancelled",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || ""}`}>
      {status}
    </span>
  );
}

function BookingSkeleton() {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
      <div className="skeleton h-3 w-56 rounded" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}

function Bookings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [activeTab, setActiveTab] = useState("single");

  const [form, setForm] = useState({ roomId: "", startTime: "", endTime: "", purpose: "" });

  const [recurringForm, setRecurringForm] = useState({
    roomId: "", startTime: "", endTime: "", purpose: "", endDate: ""
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadRooms();
    loadBookings();
  }, [user]);

  if (!user) return null;

  const loadRooms = async () => { setRooms(await authFetch("/rooms")); };
  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = user.role === "ADMIN"
        ? await authFetch("/bookings")
        : await authFetch("/bookings/my");
      setBookings(data);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onRecurringChange = (e) => setRecurringForm({ ...recurringForm, [e.target.name]: e.target.value });
  const toggleDay = (day) => setSelectedDays((prev) =>
    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
  );

  const calculateDates = () => {
    const dates = [];
    const [startHour, startMin] = recurringForm.startTime.split(":").map(Number);
    const [endHour, endMin] = recurringForm.endTime.split(":").map(Number);
    const endDate = new Date(recurringForm.endDate);
    endDate.setHours(23, 59, 59);
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= endDate) {
      if (selectedDays.includes(cursor.getDay())) {
        const start = new Date(cursor); start.setHours(startHour, startMin, 0, 0);
        const end = new Date(cursor); end.setHours(endHour, endMin, 0, 0);
        if (start > new Date()) {
          dates.push({
            startTime: start.toISOString().slice(0, 16),
            endTime: end.toISOString().slice(0, 16)
          });
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const submit = async (e) => {
    e.preventDefault();
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const now = new Date();
    if (!form.roomId) { showToast("Please select a room", "error"); return; }
    if (end <= start) { showToast("End time must be after start time", "error"); return; }
    if (start < now) { showToast("Cannot book in the past", "error"); return; }
    try {
      await authFetch(`/bookings/room/${form.roomId}`, {
        method: "POST",
        body: JSON.stringify({ startTime: form.startTime, endTime: form.endTime, purpose: form.purpose })
      });
      showToast("Booking submitted! Awaiting admin approval.", "info");
      setForm({ ...form, startTime: "", endTime: "", purpose: "" });
      loadBookings();
    } catch {
      showToast("Booking conflict — room already approved for this time", "error");
    }
  };

  const submitRecurring = async (e) => {
    e.preventDefault();
    if (!recurringForm.roomId) { showToast("Please select a room", "error"); return; }
    if (!recurringForm.startTime || !recurringForm.endTime) { showToast("Please select start and end time", "error"); return; }
    if (recurringForm.startTime >= recurringForm.endTime) { showToast("End time must be after start time", "error"); return; }
    if (!recurringForm.endDate) { showToast("Please select an end date", "error"); return; }
    if (selectedDays.length === 0) { showToast("Please select at least one day", "error"); return; }

    const dates = calculateDates();
    if (dates.length === 0) { showToast("No valid dates found for selected range", "error"); return; }

    setRecurringLoading(true);
    let success = 0, failed = 0;
    for (const date of dates) {
      try {
        await authFetch(`/bookings/room/${recurringForm.roomId}`, {
          method: "POST",
          body: JSON.stringify({ startTime: date.startTime, endTime: date.endTime, purpose: recurringForm.purpose || "Recurring booking" })
        });
        success++;
      } catch { failed++; }
    }
    setRecurringLoading(false);
    loadBookings();

    if (failed === 0) showToast(`✅ All ${success} recurring bookings submitted!`, "success");
    else if (success === 0) showToast(`❌ All ${failed} bookings failed — conflicts detected`, "error");
    else showToast(`⚠️ ${success} submitted, ${failed} failed due to conflicts`, "info");

    if (success > 0) {
      setRecurringForm({ roomId: "", startTime: "", endTime: "", purpose: "", endDate: "" });
      setSelectedDays([]);
    }
  };

  const now = new Date();
  const filtered = bookings.filter((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    if (status === "UPCOMING") return start > now;
    if (status === "ACTIVE") return start <= now && end >= now;
    if (status === "COMPLETED") return end < now;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bookings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Create and manage your room bookings
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0">
        {[
          { key: "single", label: "📅 Single Booking" },
          { key: "recurring", label: "🔁 Recurring Booking" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-150 border-b-2 -mb-px ${activeTab === tab.key
              ? "border-brand-600 text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-600/10"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SINGLE BOOKING FORM */}
      {activeTab === "single" && (
        <div className="card p-6 max-w-xl animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Create a Booking
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Bookings require admin approval before they are confirmed.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <select name="roomId" value={form.roomId} onChange={onChange} className="input" required>
              <option value="">Select Room</option>
              {rooms.filter((r) => !r.underMaintenance).map((r) => (
                <option key={r.id} value={r.id}>{r.roomNumber} (cap. {r.capacity})</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Start Time</label>
                <input type="datetime-local" name="startTime" value={form.startTime} onChange={onChange} className="input" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">End Time</label>
                <input type="datetime-local" name="endTime" value={form.endTime} onChange={onChange} className="input" required />
              </div>
            </div>

            <input type="text" name="purpose" placeholder="Purpose (optional)" value={form.purpose} onChange={onChange} className="input" />
            <button className="btn-primary w-full">Submit Booking Request</button>
          </form>
        </div>
      )}

      {/* RECURRING BOOKING FORM */}
      {activeTab === "recurring" && (
        <div className="card p-6 max-w-xl animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Recurring Booking
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Select days and a date range — we'll create a booking for each occurrence.
          </p>
          <form onSubmit={submitRecurring} className="space-y-4">
            <select name="roomId" value={recurringForm.roomId} onChange={onRecurringChange} className="input" required>
              <option value="">Select Room</option>
              {rooms.filter((r) => !r.underMaintenance).map((r) => (
                <option key={r.id} value={r.id}>{r.roomNumber} (cap. {r.capacity})</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Start Time</label>
                <input type="time" name="startTime" value={recurringForm.startTime} onChange={onRecurringChange} className="input" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">End Time</label>
                <input type="time" name="endTime" value={recurringForm.endTime} onChange={onRecurringChange} className="input" required />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Repeat Until</label>
              <input type="date" name="endDate" value={recurringForm.endDate} onChange={onRecurringChange} className="input" required />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Repeat On</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${selectedDays.includes(day.value)
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <input type="text" name="purpose" placeholder="Purpose (optional)" value={recurringForm.purpose} onChange={onRecurringChange} className="input" />

            {selectedDays.length > 0 && recurringForm.endDate && recurringForm.startTime && recurringForm.endTime && (
              <div className="flex items-center gap-2 p-3 rounded-lg border
                bg-brand-50 dark:bg-brand-600/10
                border-brand-100 dark:border-brand-500/20">
                <span className="text-brand-600 dark:text-brand-400">📋</span>
                <p className="text-xs text-brand-700 dark:text-brand-300">
                  <span className="font-bold">{calculateDates().length} bookings</span> will be created
                </p>
              </div>
            )}

            <button type="submit" disabled={recurringLoading} className="btn-primary w-full disabled:opacity-50">
              {recurringLoading ? "Creating bookings..." : "Submit Recurring Bookings"}
            </button>
          </form>
        </div>
      )}

      {/* STATUS FILTER */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3
          text-slate-400 dark:text-slate-500">
          Filter Bookings
        </p>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "UPCOMING", "ACTIVE", "COMPLETED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${status === s
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* BOOKINGS LIST */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <BookingSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No bookings found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {status === "ALL" ? "You haven't made any bookings yet" : `No ${status.toLowerCase()} bookings found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="card p-4 hover:shadow-elevated transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      Room {b.room.roomNumber}
                    </p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Booked by:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {user.role === "ADMIN" ? b.bookedBy.email : "You"}
                    </span>
                  </p>
                  {b.purpose && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Purpose: {b.purpose}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookings;
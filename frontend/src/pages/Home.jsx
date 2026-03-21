import { useEffect, useState } from "react";
import { authFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enIN } from "date-fns/locale";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "en-IN": enIN }
});

const STAT_CARDS = [
  { key: "rooms", label: "Total Rooms", icon: "🏫", color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { key: "bookings", label: "Total Bookings", icon: "📅", color: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  { key: "myBookings", label: "My Bookings", icon: "🔖", color: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { key: "upcoming", label: "Upcoming (24h)", icon: "⏰", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { key: "mostUsedRoom", label: "Most Used Room", icon: "🏆", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
];

const PIE_COLORS = ["#6366f1", "#22c55e", "#94a3b8"];

function StatSkeleton() {
  return (
    <div className="card p-6 space-y-3">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-8 w-16 rounded" />
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div className="card p-4 space-y-2">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-3 w-48 rounded" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: "badge-pending",
    APPROVED: "badge-approved",
    REJECTED: "badge-rejected",
    CANCELLED: "badge-cancelled"
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || ""}`}>
      {status}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 dark:text-slate-500 w-20 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-52 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
      {message}
    </div>
  );
}

function EmptyState({ icon, title, message }) {
  return (
    <div className="card py-16 text-center">
      <p className="text-5xl mb-4">{icon}</p>
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    rooms: 0, bookings: 0, myBookings: 0, upcoming: 0, mostUsedRoom: "-"
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [roomBarData, setRoomBarData] = useState([]);
  const [dailyLineData, setDailyLineData] = useState([]);
  const [statusPieData, setStatusPieData] = useState([]);

  useEffect(() => { if (!user) return; loadDashboard(); }, [user]);
  if (!user) return null;

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const rooms = await authFetch("/rooms");
      const myBookings = await authFetch("/bookings/my");
      const allBookings = user.role === "ADMIN"
        ? await authFetch("/bookings")
        : myBookings;

      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcoming = allBookings.filter((b) => {
        const start = new Date(b.startTime);
        return start >= now && start <= next24h;
      });

      const roomCount = {};
      allBookings.forEach((b) => {
        const rn = b.room?.roomNumber;
        if (!rn) return;
        roomCount[rn] = (roomCount[rn] || 0) + 1;
      });

      const mostUsedRoom = Object.keys(roomCount).length === 0
        ? "-"
        : Object.keys(roomCount).reduce((a, b) => roomCount[a] > roomCount[b] ? a : b);

      setStats({
        rooms: rooms.length,
        bookings: allBookings.length,
        myBookings: myBookings.length,
        upcoming: upcoming.length,
        mostUsedRoom
      });

      const source = user.role === "ADMIN" ? allBookings : myBookings;
      setRecentBookings(
        source.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).slice(0, 5)
      );

      setCalendarEvents(
        (user.role === "ADMIN" ? allBookings : myBookings).map((b) => ({
          id: b.id,
          title: `Room ${b.room?.roomNumber}${user.role === "ADMIN" ? ` — ${b.bookedBy?.email}` : ""}`,
          start: new Date(b.startTime),
          end: new Date(b.endTime),
          resource: b
        }))
      );

      const barData = Object.entries(roomCount)
        .map(([room, count]) => ({ room, bookings: count }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 6);
      setRoomBarData(barData);

      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        const count = allBookings.filter((b) => {
          const bd = new Date(b.startTime);
          return bd.getDate() === d.getDate() &&
            bd.getMonth() === d.getMonth() &&
            bd.getFullYear() === d.getFullYear();
        }).length;
        last7.push({ date: label, bookings: count });
      }
      setDailyLineData(last7);

      setStatusPieData([
        { name: "Upcoming", value: allBookings.filter(b => new Date(b.startTime) > now).length },
        { name: "Active", value: allBookings.filter(b => new Date(b.startTime) <= now && new Date(b.endTime) >= now).length },
        { name: "Completed", value: allBookings.filter(b => new Date(b.endTime) < now).length }
      ]);

    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Recharts tooltip + grid styles — adaptive to dark mode
  const tooltipStyle = {
    borderRadius: "8px",
    border: "1px solid #334155",
    fontSize: "12px",
    backgroundColor: "#1e293b",
    color: "#f1f5f9"
  };
  const gridColor = "#1e293b";
  const tickStyle = { fontSize: 11, fill: "#94a3b8" };

  return (
    <div className="space-y-8">

      {/* WELCOME HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Here's what's happening on campus today.
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${user?.role === "ADMIN"
            ? "bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-500/30"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          }`}>
          {user?.role}
        </span>
      </div>

      {/* STAT CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className="card p-5 hover:shadow-elevated transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {card.label}
                </p>
                <span className={`text-lg p-1.5 rounded-lg ${card.color}`}>
                  {card.icon}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats[card.key]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ADMIN ANALYTICS */}
      {user?.role === "ADMIN" && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Analytics</h2>
            <span className="text-xs bg-brand-50 dark:bg-brand-600/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 px-2 py-0.5 rounded-full font-medium">
              Admin Only
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* BAR CHART */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Most Booked Rooms
              </h3>
              {roomBarData.length === 0 ? <EmptyChart message="No booking data yet" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={roomBarData}>
                    <XAxis dataKey="room" tick={tickStyle} />
                    <YAxis allowDecimals={false} tick={tickStyle} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* PIE CHART */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Booking Status Distribution
              </h3>
              {stats.bookings === 0 ? <EmptyChart message="No booking data yet" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={4} dataKey="value"
                    >
                      {statusPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* LINE CHART */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Bookings Per Day — Last 7 Days
            </h3>
            {stats.bookings === 0 ? <EmptyChart message="No booking data yet" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={tickStyle} />
                  <YAxis allowDecimals={false} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* RECENT BOOKINGS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Bookings
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <BookingSkeleton key={i} />)}
          </div>
        ) : recentBookings.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No bookings yet"
            message="Your recent bookings will appear here once you start booking rooms."
          />
        ) : (
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="card p-4 hover:shadow-elevated transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        Room {b.room?.roomNumber}
                      </p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}
                    </p>
                    {user.role === "ADMIN" && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Booked by:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {b.bookedBy?.email}
                        </span>
                      </p>
                    )}
                    {b.purpose && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Purpose: {b.purpose}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CALENDAR */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Booking Calendar
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {user.role === "ADMIN" ? "Showing all bookings" : "Showing your bookings"}
            </p>
          </div>
        </div>

        <div className="card p-6">
          {calendarEvents.length === 0 && !loading ? (
            <EmptyState
              icon="🗓️"
              title="No bookings on calendar"
              message="Approved bookings will appear on the calendar."
            />
          ) : (
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 520 }}
              onSelectEvent={(event) => setSelectedEvent(event.resource)}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: "#6366f1",
                  borderRadius: "6px",
                  border: "none",
                  color: "white",
                  fontSize: "11px",
                  padding: "2px 6px"
                }
              })}
            />
          )}
        </div>
      </div>

      {/* EVENT DETAIL POPUP */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Booking Details
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <DetailRow label="Room" value={selectedEvent.room?.roomNumber} />
              <DetailRow label="From" value={new Date(selectedEvent.startTime).toLocaleString()} />
              <DetailRow label="To" value={new Date(selectedEvent.endTime).toLocaleString()} />
              {selectedEvent.purpose && (
                <DetailRow label="Purpose" value={selectedEvent.purpose} />
              )}
              {user.role === "ADMIN" && (
                <DetailRow label="Booked by" value={selectedEvent.bookedBy?.email} />
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <StatusBadge status={selectedEvent.status} />
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="btn-primary w-full mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
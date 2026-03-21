import { useEffect, useState } from "react";
import { authFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function MyBookings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setBookings(await authFetch("/bookings/my"));
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await authFetch(`/bookings/${id}`, { method: "DELETE" });
      showToast("Booking cancelled successfully!", "success");
      load();
    } catch {
      showToast("Failed to cancel booking", "error");
    }
  };

  const exportCSV = () => {
    if (bookings.length === 0) { showToast("No bookings to export", "error"); return; }
    const headers = ["Room", "Start Time", "End Time", "Purpose", "Status"];
    const rows = bookings.map((b) => [
      b.room.roomNumber,
      new Date(b.startTime).toLocaleString(),
      new Date(b.endTime).toLocaleString(),
      b.purpose || "-",
      b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `my_bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click(); URL.revokeObjectURL(url);
    showToast("CSV exported successfully!", "success");
  };

  const exportPDF = () => {
    if (bookings.length === 0) { showToast("No bookings to export", "error"); return; }
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Smart Campus — My Bookings", 14, 15);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`${user?.email} · Generated on ${new Date().toLocaleString()} · ${bookings.length} booking(s)`, 14, 23);
    autoTable(doc, {
      startY: 30,
      head: [["Room", "Start Time", "End Time", "Purpose", "Status"]],
      body: bookings.map((b) => [
        b.room.roomNumber,
        new Date(b.startTime).toLocaleString(),
        new Date(b.endTime).toLocaleString(),
        b.purpose || "-",
        b.status,
      ]),
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`my_bookings_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast("PDF exported successfully!", "success");
  };

  const now = new Date();

  const filtered = bookings.filter((b) => {
    if (filter === "PENDING") return b.status === "PENDING";
    if (filter === "APPROVED") return b.status === "APPROVED";
    if (filter === "REJECTED") return b.status === "REJECTED";
    if (filter === "CANCELLED") return b.status === "CANCELLED";
    return true;
  });

  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === "PENDING").length,
    APPROVED: bookings.filter((b) => b.status === "APPROVED").length,
    REJECTED: bookings.filter((b) => b.status === "REJECTED").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            View and manage all your room bookings
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary">📄 Export as CSV</button>
          <button onClick={exportPDF} className="btn-primary">📑 Export as PDF</button>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${filter === s
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
          >
            {s}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${filter === s
                ? "bg-white text-brand-600"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              }`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* SKELETON */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <BookingSkeleton key={i} />)}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
            {filter === "ALL" ? "No bookings yet" : `No ${filter.toLowerCase()} bookings`}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {filter === "ALL"
              ? "Head to Bookings to create your first room booking"
              : `You have no bookings with ${filter} status`}
          </p>
        </div>
      )}

      {/* BOOKINGS LIST */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((b) => {
            const notStarted = new Date(b.startTime) > now;
            const cancellable = (b.status === "PENDING" || b.status === "APPROVED") &&
              (user.role === "ADMIN" || notStarted);

            return (
              <div key={b.id} className="card p-4 hover:shadow-elevated transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        Room {b.room.roomNumber}
                      </p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}
                    </p>
                    {b.purpose && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Purpose: {b.purpose}</p>
                    )}
                  </div>
                  {cancellable && (
                    <button
                      onClick={() => cancel(b.id)}
                      className="text-xs font-medium transition flex-shrink-0
                        text-red-500 dark:text-red-400
                        hover:text-red-700 dark:hover:text-red-300 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
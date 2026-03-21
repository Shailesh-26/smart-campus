import { useEffect, useState, useCallback } from "react";
import { authFetch } from "../services/api";
import { useToast } from "../context/ToastContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Status badge ────────────────────────────────────────────────────────────
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

// ─── Skeleton row ────────────────────────────────────────────────────────────
function BookingSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="skeleton h-3 w-56 rounded" />
          <div className="skeleton h-3 w-40 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-20 rounded-lg" />
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Pagination button ───────────────────────────────────────────────────────
function PageBtn({ onClick, disabled, active, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 ${active
        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
        : disabled
          ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
    >
      {children}
    </button>
  );
}

// ─── Status filter tabs (client-side on current page) ────────────────────────
const STATUS_TABS = ["ALL", "PENDING", "UPCOMING", "ACTIVE", "COMPLETED", "REJECTED"];

// ─── Main component ──────────────────────────────────────────────────────────
function AdminBookings() {
  const { showToast } = useToast();

  // Server-side state
  const [bookings, setBookings] = useState([]);   // current page content
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination controls
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("startTime");
  const [sortDir, setSortDir] = useState("desc");

  // Filters (search is server-side; status is client-side on the page)
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  // Debounce search — wait 400 ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0); // reset to first page on new search
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch whenever page / size / sort / search changes
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        size: size,
        sortBy: sortBy,
        sortDir: sortDir,
        query: debouncedQuery,
      });
      const data = await authFetch(`/bookings/paged?${params}`);
      setBookings(data.content);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalElements);
    } catch {
      showToast("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortDir, debouncedQuery]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const approve = async (id) => {
    try {
      await authFetch(`/bookings/${id}/approve`, { method: "PUT" });
      showToast("Booking approved!", "success");
      load();
    } catch {
      showToast("Failed to approve — conflict may exist", "error");
    }
  };

  const reject = async (id) => {
    try {
      await authFetch(`/bookings/${id}/reject`, { method: "PUT" });
      showToast("Booking rejected", "info");
      load();
    } catch {
      showToast("Failed to reject booking", "error");
    }
  };

  // ── Client-side status filter (applied on current page) ──────────────────
  const now = new Date();
  const filtered = bookings.filter((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    if (status === "UPCOMING" && start <= now) return false;
    if (status === "ACTIVE" && !(start <= now && end >= now)) return false;
    if (status === "COMPLETED" && end >= now) return false;
    if (status === "PENDING" && b.status !== "PENDING") return false;
    if (status === "REJECTED" && b.status !== "REJECTED") return false;
    return true;
  });

  // Counts from the current page (for badge numbers)
  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === "PENDING").length,
    UPCOMING: bookings.filter((b) => new Date(b.startTime) > now).length,
    ACTIVE: bookings.filter((b) => new Date(b.startTime) <= now && new Date(b.endTime) >= now).length,
    COMPLETED: bookings.filter((b) => new Date(b.endTime) < now).length,
    REJECTED: bookings.filter((b) => b.status === "REJECTED").length,
  };

  // ── Exports (export current page) ────────────────────────────────────────
  const exportCSV = () => {
    if (filtered.length === 0) { showToast("No bookings to export", "error"); return; }
    const headers = ["Room", "Booked By", "Start Time", "End Time", "Purpose", "Status"];
    const rows = filtered.map((b) => [
      b.room.roomNumber,
      b.bookedBy.email,
      new Date(b.startTime).toLocaleString(),
      new Date(b.endTime).toLocaleString(),
      b.purpose || "-",
      b.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings_page${page + 1}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!", "success");
  };

  const exportPDF = () => {
    if (filtered.length === 0) { showToast("No bookings to export", "error"); return; }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Smart Campus — Booking Report", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated on ${new Date().toLocaleString()} · Page ${page + 1} of ${totalPages} · ${filtered.length} booking(s)`,
      14, 23
    );
    autoTable(doc, {
      startY: 30,
      head: [["Room", "Booked By", "Start Time", "End Time", "Purpose", "Status"]],
      body: filtered.map((b) => [
        b.room.roomNumber,
        b.bookedBy.email,
        new Date(b.startTime).toLocaleString(),
        new Date(b.endTime).toLocaleString(),
        b.purpose || "-",
        b.status,
      ]),
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`bookings_page${page + 1}_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast("PDF exported!", "success");
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  // Show at most 5 page number buttons centred around current page
  const pageNumbers = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage and approve all campus bookings
            {!loading && (
              <span className="ml-2 text-brand-600 dark:text-brand-400 font-semibold">
                ({totalItems} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary">Export as CSV</button>
          <button onClick={exportPDF} className="btn-primary">Export as PDF</button>
        </div>
      </div>

      {/* SEARCH + SORT CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="🔍  Search by room number or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input flex-1 max-w-md"
        />
        <div className="flex gap-2">
          {/* Sort field */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
            className="input text-sm py-2 pr-8"
          >
            <option value="startTime">Sort: Start Time</option>
            <option value="endTime">Sort: End Time</option>
            <option value="status">Sort: Status</option>
          </select>
          {/* Sort direction toggle */}
          <button
            onClick={() => { setSortDir((d) => d === "desc" ? "asc" : "desc"); setPage(0); }}
            className="btn-secondary px-3 text-sm"
            title={sortDir === "desc" ? "Descending" : "Ascending"}
          >
            {sortDir === "desc" ? "↓ Desc" : "↑ Asc"}
          </button>
          {/* Page size */}
          <select
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            className="input text-sm py-2 pr-8"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
      </div>

      {/* STATUS FILTERS (client-side on current page) */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${status === s
              ? "bg-brand-600 text-white"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
          >
            {s}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${status === s
              ? "bg-white text-brand-600"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              }`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* RESULTS COUNT */}
      {!loading && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Page <span className="font-semibold text-slate-600 dark:text-slate-300">{page + 1}</span>
          {" "}of{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{totalPages}</span>
          {" "}·{" "}
          Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span>
          {" "}of{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{totalItems}</span>
          {" "}total booking(s)
        </p>
      )}

      {/* SKELETON */}
      {loading && (
        <div className="space-y-3">
          {[...Array(size > 5 ? 5 : size)].map((_, i) => <BookingSkeleton key={i} />)}
        </div>
      )}

      {/* EMPTY */}
      {!loading && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No bookings found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {query
              ? `No results for "${query}"`
              : `No ${status.toLowerCase()} bookings on this page`}
          </p>
        </div>
      )}

      {/* BOOKINGS LIST */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="card p-5 hover:shadow-elevated transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      Room {b.room.roomNumber}
                    </p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(b.startTime).toLocaleString()} →{" "}
                    {new Date(b.endTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    Booked by:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {b.bookedBy.email}
                    </span>
                  </p>
                  {b.purpose && (
                    <p className="text-xs text-slate-500">Purpose: {b.purpose}</p>
                  )}
                </div>

                {b.status === "PENDING" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => approve(b.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => reject(b.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {totalItems} booking(s) total
          </p>
          <div className="flex items-center gap-1.5">
            {/* First */}
            <PageBtn onClick={() => setPage(0)} disabled={page === 0}>
              «
            </PageBtn>
            {/* Prev */}
            <PageBtn onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              ‹
            </PageBtn>

            {/* Ellipsis left */}
            {pageNumbers()[0] > 0 && (
              <span className="text-xs text-slate-400 px-1">…</span>
            )}

            {/* Page number buttons */}
            {pageNumbers().map((n) => (
              <PageBtn
                key={n}
                onClick={() => setPage(n)}
                active={n === page}
              >
                {n + 1}
              </PageBtn>
            ))}

            {/* Ellipsis right */}
            {pageNumbers().at(-1) < totalPages - 1 && (
              <span className="text-xs text-slate-400 px-1">…</span>
            )}

            {/* Next */}
            <PageBtn onClick={() => setPage((p) => p + 1)} disabled={page === totalPages - 1}>
              ›
            </PageBtn>
            {/* Last */}
            <PageBtn onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>
              »
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
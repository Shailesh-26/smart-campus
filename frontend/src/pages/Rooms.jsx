import { useEffect, useState } from "react";
import { authFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Rooms() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ roomNumber: "", capacity: "" });
  const [editingId, setEditingId] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(null); // roomId being toggled

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [sortBy, setSortBy] = useState("roomNumber");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [roomData, bookingData] = await Promise.all([
        authFetch("/rooms"),
        user?.role === "ADMIN" ? authFetch("/bookings") : authFetch("/bookings/my")
      ]);
      setRooms(roomData);
      setBookings(bookingData);
    } catch {
      showToast("Failed to load rooms", "error");
    } finally {
      setLoading(false);
    }
  };

  const isRoomBusy = (roomId) => {
    const now = new Date();
    return bookings.some((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return b.room.id === roomId && b.status === "APPROVED" && start <= now && end >= now;
    });
  };

  const getBusyUntil = (roomId) => {
    const now = new Date();
    const active = bookings.find((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return b.room.id === roomId && b.status === "APPROVED" && start <= now && end >= now;
    });
    return active?.endTime || null;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const cancelEdit = () => { setEditingId(null); setFormData({ roomNumber: "", capacity: "" }); };
  const resetFilters = () => { setSearch(""); setMinCapacity(""); setSortBy("roomNumber"); setAvailabilityFilter("ALL"); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await authFetch(`/rooms/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ roomNumber: formData.roomNumber, capacity: Number(formData.capacity) })
        });
        showToast("Room updated successfully!", "success");
      } else {
        await authFetch("/rooms", {
          method: "POST",
          body: JSON.stringify({ roomNumber: formData.roomNumber, capacity: Number(formData.capacity) })
        });
        showToast("Room created successfully!", "success");
      }
      setFormData({ roomNumber: "", capacity: "" });
      setEditingId(null);
      loadAll();
    } catch {
      showToast("Failed to save room", "error");
    }
  };

  const handleEdit = (room) => {
    setEditingId(room.id);
    setFormData({ roomNumber: room.roomNumber, capacity: room.capacity });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this room?")) return;
    try {
      await authFetch(`/rooms/${id}`, { method: "DELETE" });
      showToast("Room deleted successfully!", "success");
      loadAll();
    } catch {
      showToast("Failed to delete room", "error");
    }
  };

  // ✅ TOGGLE MAINTENANCE
  const handleMaintenance = async (room) => {
    const block = !room.underMaintenance;
    setMaintenanceLoading(room.id);
    try {
      await authFetch(`/rooms/${room.id}/maintenance?block=${block}`, { method: "PUT" });
      showToast(
        block ? `Room ${room.roomNumber} blocked for maintenance` : `Room ${room.roomNumber} is now available`,
        block ? "info" : "success"
      );
      loadAll();
    } catch {
      showToast("Failed to update maintenance status", "error");
    } finally {
      setMaintenanceLoading(null);
    }
  };

  const activeFilterCount = [
    search !== "",
    minCapacity !== "",
    sortBy !== "roomNumber",
    availabilityFilter !== "ALL"
  ].filter(Boolean).length;

  let filteredRooms = [...rooms];
  if (search) filteredRooms = filteredRooms.filter((r) => r.roomNumber.toLowerCase().includes(search.toLowerCase()));
  if (minCapacity) filteredRooms = filteredRooms.filter((r) => r.capacity >= Number(minCapacity));
  if (availabilityFilter === "AVAILABLE") filteredRooms = filteredRooms.filter((r) => !isRoomBusy(r.id) && !r.underMaintenance);
  if (availabilityFilter === "BUSY") filteredRooms = filteredRooms.filter((r) => isRoomBusy(r.id));
  if (availabilityFilter === "MAINTENANCE") filteredRooms = filteredRooms.filter((r) => r.underMaintenance);
  filteredRooms.sort((a, b) =>
    sortBy === "capacity" ? b.capacity - a.capacity : a.roomNumber.localeCompare(b.roomNumber)
  );

  // Stats including maintenance count
  const maintenanceCount = rooms.filter((r) => r.underMaintenance).length;
  const availableCount = rooms.filter((r) => !isRoomBusy(r.id) && !r.underMaintenance).length;
  const busyCount = rooms.filter((r) => isRoomBusy(r.id)).length;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rooms</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Live availability across all campus rooms
        </p>
      </div>

      {/* ADMIN FORM */}
      {user?.role === "ADMIN" && (
        <div className="card p-6 max-w-xl">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
            {editingId ? "✏️ Edit Room" : "➕ Add New Room"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text" name="roomNumber"
              placeholder="Room Number (e.g. A101)"
              value={formData.roomNumber} onChange={handleChange}
              required className="input"
            />
            <input
              type="number" name="capacity"
              placeholder="Capacity (e.g. 30)"
              value={formData.capacity} onChange={handleChange}
              required className="input"
            />
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary">
                {editingId ? "Update Room" : "Create Room"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="btn-secondary">Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* STATS BAR */}
      {!loading && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Total", value: rooms.length, color: "text-slate-700 dark:text-slate-200" },
            { label: "Available", value: availableCount, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Busy", value: busyCount, color: "text-red-500 dark:text-red-400" },
            { label: "Maintenance", value: maintenanceCount, color: "text-amber-600 dark:text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="card px-5 py-3 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</span>
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* FILTER TOGGLE */}
      <div className="flex items-center gap-3">
        <button onClick={() => setFiltersOpen(!filtersOpen)} className="btn-secondary flex items-center gap-2">
          <span>🔽 Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline">
            Reset all
          </button>
        )}
      </div>

      {/* FILTER BAR */}
      {filtersOpen && (
        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {[
            {
              label: "Search Room",
              content: <input type="text" placeholder="e.g. A101" value={search}
                onChange={(e) => setSearch(e.target.value)} className="input" />
            },
            {
              label: "Min Capacity",
              content: <input type="number" placeholder="e.g. 30" value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)} className="input" />
            },
            {
              label: "Sort By",
              content: (
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
                  <option value="roomNumber">Room Number</option>
                  <option value="capacity">Capacity (High to Low)</option>
                </select>
              )
            },
            {
              label: "Availability",
              content: (
                <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className="input">
                  <option value="ALL">All Rooms</option>
                  <option value="AVAILABLE">Available Only</option>
                  <option value="BUSY">Busy Only</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              )
            },
          ].map(({ label, content }) => (
            <div key={label}>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block
                text-slate-500 dark:text-slate-400">
                {label}
              </label>
              {content}
            </div>
          ))}
        </div>
      )}

      {/* RESULTS SUMMARY */}
      {!loading && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{filteredRooms.length}</span>
          {" "}of{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{rooms.length}</span>
          {" "}rooms
        </p>
      )}

      {/* SKELETON */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-24 rounded" />
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-8 w-full rounded mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredRooms.length === 0 && (
        <div className="card py-16 text-center">
          <p className="text-5xl mb-4">{rooms.length === 0 ? "🏫" : "🔍"}</p>
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
            {rooms.length === 0 ? "No rooms yet" : "No rooms match your filters"}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
            {rooms.length === 0
              ? "Add your first room using the form above"
              : "Try adjusting your search or filters"}
          </p>
          {rooms.length > 0 && (
            <button onClick={resetFilters} className="btn-secondary mx-auto">Reset Filters</button>
          )}
        </div>
      )}

      {/* ROOM CARDS */}
      {!loading && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const busy = isRoomBusy(room.id);
            const busyUntil = getBusyUntil(room.id);
            const maintenance = room.underMaintenance;
            const isToggling = maintenanceLoading === room.id;

            // Determine card top colour
            const topBg = maintenance
              ? "bg-amber-50 dark:bg-amber-500/10"
              : busy
                ? "bg-red-50 dark:bg-red-500/10"
                : "bg-emerald-50 dark:bg-emerald-500/10";

            // Status badge
            const statusBadge = maintenance ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border
                bg-amber-100 dark:bg-amber-500/20
                text-amber-700 dark:text-amber-400
                border-amber-200 dark:border-amber-500/30">
                🔧 Maintenance
              </span>
            ) : busy ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border
                bg-red-100 dark:bg-red-500/20
                text-red-600 dark:text-red-400
                border-red-200 dark:border-red-500/30">
                🔴 Busy until {new Date(busyUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border
                bg-emerald-100 dark:bg-emerald-500/20
                text-emerald-600 dark:text-emerald-400
                border-emerald-200 dark:border-emerald-500/30">
                🟢 Available
              </span>
            );

            return (
              <div key={room.id} className="card hover:shadow-elevated transition-all duration-200 overflow-hidden">

                {/* CARD TOP */}
                <div className={`px-5 py-4 ${topBg}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      {room.roomNumber}
                    </h3>
                    {statusBadge}
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm mb-4 text-slate-600 dark:text-slate-300">
                    <span>👥</span>
                    <span>Capacity: <strong className="text-slate-800 dark:text-white">{room.capacity}</strong></span>
                  </div>

                  {/* ADMIN ACTIONS */}
                  {user?.role === "ADMIN" && (
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">

                      {/* EDIT + DELETE */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(room)}
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border transition font-medium
                            border-brand-200 dark:border-brand-500/30
                            text-brand-600 dark:text-brand-400
                            hover:bg-brand-50 dark:hover:bg-brand-600/10"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border transition font-medium
                            border-red-200 dark:border-red-500/30
                            text-red-500 dark:text-red-400
                            hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      {/* MAINTENANCE TOGGLE */}
                      <button
                        onClick={() => handleMaintenance(room)}
                        disabled={isToggling}
                        className={`w-full text-xs px-3 py-1.5 rounded-lg border transition font-medium
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center gap-1.5 ${maintenance
                            ? "border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            : "border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                          }`}
                      >
                        {isToggling ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : maintenance ? (
                          "✅ Mark Available"
                        ) : (
                          "🔧 Block for Maintenance"
                        )}
                      </button>
                    </div>
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

export default Rooms;
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 p-5">
      <h1 className="text-xl font-bold mb-8 text-indigo-400">
        Smart Campus
      </h1>

      <nav className="space-y-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `block px-3 py-2 rounded ${
              isActive ? "bg-gray-700" : "hover:bg-gray-700"
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/rooms"
          className={({ isActive }) =>
            `block px-3 py-2 rounded ${
              isActive ? "bg-gray-700" : "hover:bg-gray-700"
            }`
          }
        >
          Rooms
        </NavLink>

        <NavLink
          to="/bookings"
          className={({ isActive }) =>
            `block px-3 py-2 rounded ${
              isActive ? "bg-gray-700" : "hover:bg-gray-700"
            }`
          }
        >
          Bookings
        </NavLink>

        {user?.role === "ADMIN" && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            Users
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;

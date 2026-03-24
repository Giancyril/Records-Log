import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAdminUser, signOut } from "../../auth/auth";
import { toast } from "react-toastify";
import {
  FaHome, FaFileAlt, FaHistory, FaCog, FaBars, FaTimes,
  FaSignOutAlt, FaChevronDown,FaChartBar
} from "react-icons/fa";

const NAV = [
  { to: "/dashboard",     label: "Overview",     icon: FaHome },
  { to: "/records",       label: "Records",       icon: FaFileAlt },
  { to: "/activity-logs", label: "Activity Logs", icon: FaHistory },
  { to: "/settings",      label: "Settings",      icon: FaCog },
  { to: "/analytics", label: "Analytics", icon: FaChartBar }
];

// ─── Sidebar content ──────────────────────────────────────────────────────────
// Intentionally defined OUTSIDE DashboardLayout so React never remounts it on
// parent re-renders — remounting was breaking NavLink click events on mobile.
function SidebarContent({
  userName,
  userEmail,
  initial,
  onNavigate,
  onSignOut,
}: {
  userName: string;
  userEmail: string;
  initial: string;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
              alt="NBSC"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = "none";
                const fb = img.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = "flex";
              }}
            />
            <span
              className="text-blue-400 text-sm font-black select-none w-full h-full items-center justify-center"
              style={{ display: "none" }}
            >N</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold leading-tight">NBSC SAS</p>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Records Log</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={14} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User row */}
      <div className="px-3 py-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-gray-500 text-[10px] truncate">{userEmail}</p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="text-gray-600 hover:text-red-400 transition-colors shrink-0 p-1"
          >
            <FaSignOutAlt size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const currentUser = useAdminUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#profile-menu")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const handleSignOut = () => {
    signOut(navigate);
    toast.info("Signed out");
  };

  const userName  = currentUser?.name  || "Admin";
  const userEmail = currentUser?.email || "";
  const initial   = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-gray-900 border-r border-white/5 fixed inset-y-0 left-0 z-30">
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          initial={initial}
          onNavigate={() => {}}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dim backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <aside className="relative z-10 w-64 max-w-[82vw] h-full bg-gray-900 border-r border-white/5 flex flex-col shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={11} />
            </button>

            <SidebarContent
              userName={userName}
              userEmail={userEmail}
              initial={initial}
              onNavigate={() => setSidebarOpen(false)}
              onSignOut={() => { setSidebarOpen(false); handleSignOut(); }}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-sm border-b border-white/5 px-4 lg:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <FaBars size={13} />
          </button>

          {/* Logo in topbar — mobile only */}
          <div className="flex lg:hidden items-center gap-2.5 flex-1">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                alt="NBSC"
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const fb = img.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <span
                className="text-blue-400 text-[10px] font-black w-full h-full items-center justify-center"
                style={{ display: "none" }}
              >N</span>
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-tight tracking-wide">NBSC SAS</p>
              <p className="text-gray-500 text-[9px] uppercase tracking-widest leading-none">Records Log</p>
            </div>
          </div>

          <div className="hidden lg:flex flex-1" />

          {/* Profile */}
          <div id="profile-menu" className="relative">
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black">{initial}</span>
              </div>
              <span className="hidden sm:block text-white text-xs font-semibold max-w-[120px] truncate">
                {userName}
              </span>
              <FaChevronDown
                size={9}
                className={`hidden sm:block text-gray-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white text-xs font-semibold truncate">{userName}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5 truncate">{userEmail}</p>
                </div>
                <div className="py-1">
                  <NavLink
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-xs"
                  >
                    <FaCog size={11} className="text-gray-400 shrink-0" />
                    Settings
                  </NavLink>
                  <div className="mx-3 my-1 border-t border-white/5" />
                  <button
                    onClick={() => { setProfileOpen(false); handleSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs"
                  >
                    <FaSignOutAlt size={11} className="text-red-400 shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 py-6 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
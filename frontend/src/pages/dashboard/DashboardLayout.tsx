import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAdminUser, signOut } from "../../auth/auth";
import { useGetNotificationsQuery } from "../../redux/api/api";
import { toast } from "react-toastify";
import type { ActivityLog } from "../../types/types";
import {
  FaHome, FaFileAlt, FaHistory, FaCog, FaBars, FaTimes,
  FaSignOutAlt, FaChevronDown, FaChartBar, FaBoxOpen, FaSearch,
  FaBell, FaPlus, FaInbox, FaShare, FaTrash, FaArchive, FaEdit, FaCheck,
} from "react-icons/fa";

const NAV = [
  { to: "/dashboard",     label: "Overview",       icon: FaHome },
  { to: "/records",       label: "Records",        icon: FaFileAlt },
  { to: "/track",         label: "Track Document", icon: FaSearch },
  { to: "/archive",       label: "Archive",        icon: FaBoxOpen },
  { to: "/analytics",     label: "Analytics",      icon: FaChartBar },
  { to: "/activity-logs", label: "Activity Logs",  icon: FaHistory },
];

// ─── Notification helpers ─────────────────────────────────────────────────────
const SEEN_KEY    = "nbsc_notif_seen_id";
const CLEARED_KEY = "nbsc_notif_cleared_at";
const READ_IDS_KEY = "nbsc_notif_read_ids";

function getSeenId(): string { return localStorage.getItem(SEEN_KEY) ?? ""; }
function setSeenId(id: string) { localStorage.setItem(SEEN_KEY, id); }

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_IDS_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function saveReadIds(ids: Set<string>) {
  // Keep max 200 IDs to avoid bloat
  const arr = Array.from(ids).slice(-200);
  localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr));
}

/** Pick an icon + color based on the action string */
function notifMeta(action: string): { icon: React.ReactNode; color: string; dot: string } {
  const a = action.toLowerCase();
  if (a.includes("create") || a.includes("import"))
    return { icon: <FaPlus size={9} />,    color: "text-emerald-400", dot: "bg-emerald-400" };
  if (a.includes("receive"))
    return { icon: <FaInbox size={9} />,   color: "text-blue-400",    dot: "bg-blue-400" };
  if (a.includes("release"))
    return { icon: <FaShare size={9} />,   color: "text-cyan-400",    dot: "bg-cyan-400" };
  if (a.includes("delete"))
    return { icon: <FaTrash size={9} />,   color: "text-red-400",     dot: "bg-red-400" };
  if (a.includes("archive"))
    return { icon: <FaArchive size={9} />, color: "text-amber-400",   dot: "bg-amber-400" };
  return   { icon: <FaEdit size={9} />,    color: "text-purple-400",  dot: "bg-purple-400" };
}

function fmtRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Notification bell + dropdown ────────────────────────────────────────────
function NotificationBell() {
  const [open,      setOpen]      = useState(false);
  const [seenId,    setSeenIdS]   = useState(getSeenId);
  const [clearedAt, setClearedAt] = useState<string>(() => localStorage.getItem(CLEARED_KEY) ?? "");
  const [readIds,   setReadIds]   = useState<Set<string>>(getReadIds);
  const dropRef                   = useRef<HTMLDivElement>(null);

  // Poll every 30 s
  const { data } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus:  true,
  });

  const allLogs: ActivityLog[] = (data as any)?.data ?? [];

  // Hide logs that were cleared
  const logs = clearedAt
    ? allLogs.filter(l => new Date(l.createdAt) > new Date(clearedAt))
    : allLogs;

  const latest = logs[0];

  // A log is unread if its id > seenId AND not individually read
  const isLogUnread = (log: ActivityLog) => {
    if (readIds.has(log.id)) return false;
    return seenId ? log.id > seenId : true;
  };

  const unreadCount = logs.filter(isLogUnread).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = useCallback(() => setOpen(o => !o), []);

  // Mark single notification as read on click
  const handleItemClick = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    if (!latest?.id) return;
    setSeenId(latest.id);
    setSeenIdS(latest.id);
    // Also clear individual read tracking since all are now read via seenId
    setReadIds(new Set());
    saveReadIds(new Set());
  }, [latest]);

  const handleClearAll = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(CLEARED_KEY, now);
    setClearedAt(now);
    if (latest?.id) { setSeenId(latest.id); setSeenIdS(latest.id); }
    setReadIds(new Set());
    saveReadIds(new Set());
  }, [latest]);

  return (
    <div ref={dropRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        title="Notifications"
      >
        <FaBell size={13} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-lg shadow-red-500/40 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 space-y-2">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBell size={11} className="text-blue-400" />
                <p className="text-white text-xs font-bold">Notifications</p>
                {unreadCount === 0 && logs.length > 0 && (
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">All read</span>
                )}
              </div>
              {logs.length > 0 && (
                <span className="text-[10px] text-gray-600">{logs.length} recent</span>
              )}
            </div>
            {/* Action buttons row */}
            {logs.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FaCheck size={8} /> Mark all read
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-semibold transition-all"
                >
                  <FaTimes size={8} /> Clear all
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04]">
            {logs.length === 0 ? (
              <div className="py-10 text-center">
                <FaBell size={24} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No notifications</p>
              </div>
            ) : (
              logs.map((log) => {
                const { icon, color, dot } = notifMeta(log.action);
                const isUnread = isLogUnread(log);
                return (
                  <div
                    key={log.id}
                    onClick={() => isUnread && handleItemClick(log.id)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      isUnread
                        ? "bg-blue-500/[0.04] hover:bg-blue-500/[0.07] cursor-pointer"
                        : "hover:bg-white/[0.02] cursor-default"
                    }`}
                  >
                    {/* Icon bubble */}
                    <div className={`w-7 h-7 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight truncate ${isUnread ? "text-white" : "text-gray-400"}`}>
                        {log.entityName ?? log.action}
                      </p>
                      <p className="text-gray-500 text-[10px] mt-0.5 leading-snug line-clamp-2">
                        {log.details || log.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {log.adminName && (
                          <span className="text-gray-600 text-[10px]">{log.adminName}</span>
                        )}
                        <span className="text-gray-700 text-[10px]">·</span>
                        <span className="text-gray-600 text-[10px]">{fmtRelative(log.createdAt)}</span>
                        {isUnread && (
                          <span className="text-[9px] text-blue-400/60 font-medium ml-auto">tap to mark read</span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0 mt-2`} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {logs.length > 0 && (
            <div className="py-2.5 border-t border-white/5 bg-gray-900/60 flex justify-center">
              <NavLink
                to="/activity-logs"
                onClick={() => setOpen(false)}
                className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold transition-colors"
              >
                View all activity logs →
              </NavLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({
  onNavigate,
}: {
  userName:   string;
  userEmail:  string;
  initial:    string;
  onNavigate: () => void;
  onSignOut:  () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 border-b border-white/5 shrink-0 h-14 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
              alt="NBSC"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = "none";
                const fb = img.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = "flex";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold tracking-widest">NBSC SAS</p>
            <p className="text-gray-500 text-[9px] uppercase tracking-widest">Records Log</p>
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
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border-blue-500/20"
                  : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={14} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
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
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#profile-menu")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const handleSignOut = () => { signOut(navigate); toast.info("Signed out"); };

  const userName  = currentUser?.name  || "Admin";
  const userEmail = currentUser?.email || "";
  const initial   = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-gray-900 border-r border-white/5 fixed inset-y-0 left-0 z-30">
        <SidebarContent
          userName={userName} userEmail={userEmail} initial={initial}
          onNavigate={() => {}} onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile drawer overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 flex transition-visibility duration-300 ${sidebarOpen ? "visible" : "invisible"}`}>
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ease-in-out ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`relative z-10 w-64 max-w-[82vw] h-full bg-gray-900 border-r border-white/5 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300 ${sidebarOpen ? "opacity-100 delay-200" : "opacity-0"}`}
          >
            <FaTimes size={16} />
          </button>
          <SidebarContent
            userName={userName} userEmail={userEmail} initial={initial}
            onNavigate={() => setSidebarOpen(false)}
            onSignOut={() => { setSidebarOpen(false); handleSignOut(); }}
          />
        </aside>
      </div>

      {/* Main */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-white/5 px-4 lg:px-6 h-14 flex items-center gap-3">

          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <FaBars size={13} />
          </button>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0" />
          </div>

          <div className="hidden lg:flex flex-1" />

          {/* ── Right side: bell + profile ── */}
          <div className="flex items-center gap-2">

            {/* Notification bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-5 bg-white/10" />

            {/* Profile */}
            <div id="profile-menu" className="relative">
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-3 focus:outline-none group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
                  <span className="text-white text-[11px] font-black">{initial}</span>
                </div>
                <div className="hidden sm:flex flex-col items-start text-left min-w-0">
                  <span className="text-white text-xs font-bold leading-tight truncate w-full max-w-[120px]">{userName}</span>
                  <span className="text-gray-500 text-[10px] leading-tight truncate w-full max-w-[140px]">{userEmail}</span>
                </div>
                <FaChevronDown size={9} className={`hidden sm:block text-gray-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
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
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 py-6 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { isAuthenticated } from "./auth/auth";

import LoginPage       from "./pages/login/Login";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import OverviewPage    from "./pages/dashboard/Overview";
import RecordsPage     from "./pages/records/RecordsPage";
import ArchivePage     from "./pages/records/ArchivePage";
import NewRecordPage   from "./pages/records/NewRecord";
import RecordDetail    from "./pages/records/RecordDetail";
import ActivityPage    from "./pages/activity/ActivityLogsPage";
import SettingsPage    from "./pages/settings/SettingsPage";
import AnalyticsPage    from "./pages/analytics/AnalyticsPage"
import TrackRecordPage from "./pages/track/TrackRecord";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);

    // Keep server awake
    const ping = () => {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
      console.log("Ping Debug - URL:", apiUrl);
      fetch(apiUrl).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 10 * 60 * 1000);
    return () => { window.removeEventListener("resize", handler); clearInterval(interval); };
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"          element={<OverviewPage />} />
            <Route path="records"            element={<RecordsPage />} />
            <Route path="archive"            element={<ArchivePage />} />
            <Route path="records/new"        element={<NewRecordPage />} />
            <Route path="records/:id"        element={<RecordDetail />} />
            <Route path="activity-logs"      element={<ActivityPage />} />
            <Route path="settings"           element={<SettingsPage />} />
            <Route path="analytics"          element={<AnalyticsPage />} />
            <Route path="track"              element={<TrackRecordPage />} /> 
            <Route path="track/:code"        element={<TrackRecordPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position={isMobile ? "top-center" : "top-right"}
        autoClose={3000}
        theme="dark"
        toastStyle={{
          background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", color: "#f9fafb", fontSize: "14px",
          padding: "14px 18px", minHeight: "unset",
        }}
        style={isMobile
          ? { top: "30px", left: "50%", transform: "translateX(-50%)", width: "auto", minWidth: "320px", maxWidth: "calc(100vw - 32px)" }
          : { top: "16px", right: "16px" }}
      />
    </>
  );
}
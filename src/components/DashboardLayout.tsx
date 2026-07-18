import React, { useState, useEffect, useRef } from "react";
import { LoggedInUser, NotificationItem } from "../types";
import { Bell, Coins, LogOut, Loader2, Sparkles, User, Globe } from "lucide-react";
import SupporterDashboard from "./SupporterDashboard";
import CreatorDashboard from "./CreatorDashboard";
import AdminDashboard from "./AdminDashboard";

interface DashboardLayoutProps {
  user: LoggedInUser;
  token: string;
  onLogout: () => void;
  onNavigateHome: () => void;
  onUpdateCredits: (credits: number) => void;
}

export default function DashboardLayout({ user, token, onLogout, onNavigateHome, onUpdateCredits }: DashboardLayoutProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // Fetch notifications
  const fetchNotifications = () => {
    fetch("/api/notifications", { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(err => console.error("Error loading notifications", err));
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 8 seconds for a lively real-time experience!
    const timer = setInterval(fetchNotifications, 8000);
    return () => clearInterval(timer);
  }, []);

  // Handle outside click to hide notification popup (Requirement!)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    fetch(`/api/notifications/${id}/read`, {
      method: "POST",
      headers
    })
      .then(res => {
        if (res.ok) {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
      })
      .catch(err => console.error(err));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div id="dashboard-layout" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Dashboard Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span
              onClick={onNavigateHome}
              className="font-display font-extrabold text-xl md:text-2xl tracking-tight text-slate-900 cursor-pointer flex items-center gap-1.5"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center mr-1">
                <div className="w-4 h-4 border-2 border-white rotate-45"></div>
              </div>
              CrowdFund
            </span>
          </div>

          {/* Controls Panel */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* Direct Home Anchor */}
            <button
              onClick={onNavigateHome}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg cursor-pointer transition"
            >
              <Globe className="w-4 h-4" /> Home Landing
            </button>

            {/* Notification bell and float pop-up */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Floating notification pop-up */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 bg-white border border-slate-200 shadow-xl rounded-2xl w-[320px] md:w-[360px] overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="font-display font-bold text-slate-800 text-sm">Notifications</span>
                    <span className="text-[10px] font-mono text-slate-400">{unreadCount} new</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">No notifications recorded yet.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-3.5 text-xs transition cursor-pointer hover:bg-slate-50 ${
                            !notif.read ? "bg-indigo-50/30 border-l-2 border-indigo-500" : ""
                          }`}
                        >
                          <p className="text-slate-700 leading-relaxed">{notif.message}</p>
                          <span className="text-[9px] font-mono text-slate-400 block mt-1">
                            {new Date(notif.time).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Available Credits */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl">
              <Coins className="w-4 h-4 text-indigo-600" />
              <span className="font-mono text-xs font-bold leading-none">{user.credits.toLocaleString()} Cr</span>
            </div>

            {/* User Meta Card */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <span className="font-display font-bold text-slate-900 text-xs block leading-tight">{user.name}</span>
                <span className="font-mono text-[10px] text-indigo-600 uppercase font-bold">{user.role}</span>
              </div>
              <img
                src={user.photoUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border bg-slate-100 shrink-0"
              />
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Dynamic Route Render based on user Role */}
        {user.role === "Supporter" && (
          <SupporterDashboard user={user} token={token} onUpdateCredits={onUpdateCredits} />
        )}
        {user.role === "Creator" && (
          <CreatorDashboard user={user} token={token} onUpdateCredits={onUpdateCredits} />
        )}
        {user.role === "Admin" && (
          <AdminDashboard user={user} token={token} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 mt-12 text-center text-xs font-mono">
        <p>&copy; {new Date().getFullYear()} CrowdFund Platform. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

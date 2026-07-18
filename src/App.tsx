import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LoggedInUser, Campaign } from "./types";
import Home from "./components/Home";
import Auth from "./components/Auth";
import DashboardLayout from "./components/DashboardLayout";
import { Sparkles, Compass, LogIn, UserPlus, Github, Linkedin, Facebook, HelpCircle, Coins, LayoutDashboard, LogOut, Loader2 } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("crowdfund_token"));
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "explore" | "auth-login" | "auth-register" | "dashboard">("home");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // For non-logged-in detailed campaigns
  const [campaignDetails, setCampaignDetails] = useState<Campaign | null>(null);

  // Authenticate / Fetch Profile if Token exists
  useEffect(() => {
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((res) => {
          if (!res.ok) {
            // Clear expired or invalid sessions
            localStorage.removeItem("crowdfund_token");
            localStorage.removeItem("crowdfund_user");
            setToken(null);
            setUser(null);
            throw new Error("Expired session");
          }
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setUser(data.user);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUser: LoggedInUser) => {
    setToken(newToken);
    setUser(newUser);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("crowdfund_token");
    localStorage.removeItem("crowdfund_user");
    setToken(null);
    setUser(null);
    setCurrentView("home");
  };

  const handleUpdateCredits = (newCredits: number) => {
    if (user) {
      const updated = { ...user, credits: newCredits };
      setUser(updated);
      localStorage.setItem("crowdfund_user", JSON.stringify(updated));
    }
  };

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignId(id);
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaignDetails(data);
        setCurrentView("explore");
      })
      .catch((err) => console.error(err));
  };

  return (
    <div id="application-container" className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* Universal Header (Only shown outside the actual Dashboard Layout to avoid clutter) */}
      {currentView !== "dashboard" && (
        <header id="universal-navbar" className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 py-4 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* Website Name / Logo */}
            <div
              onClick={() => {
                setCurrentView("home");
                setSelectedCampaignId(null);
                setCampaignDetails(null);
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rotate-45"></div>
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
                CrowdFund
              </span>
            </div>

            {/* Navigation links */}
            <div className="flex items-center gap-3 md:gap-6">
              
              <button
                onClick={() => {
                  setCurrentView("explore");
                  setSelectedCampaignId(null);
                  setCampaignDetails(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition cursor-pointer ${
                  currentView === "explore" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Compass className="w-4 h-4" />
                Explore Campaigns
              </button>

              {/* Developer redirection link */}
              <a
                href="https://github.com/sumon3210"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold font-mono uppercase tracking-wider transition"
              >
                <Github className="w-4 h-4" />
                Join as Developer
              </a>

              {user ? (
                // Logged-in Controls
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <button
                    onClick={() => setCurrentView("dashboard")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    Dashboard
                  </button>

                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800 text-xs font-bold font-mono">
                    <Coins className="w-4 h-4 text-indigo-600" />
                    {user.credits.toLocaleString()} Cr
                  </div>

                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border bg-slate-100 shrink-0 cursor-pointer"
                    onClick={() => setCurrentView("dashboard")}
                    title={`${user.name} (${user.role})`}
                  />

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Non logged-in Controls
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <button
                    onClick={() => setCurrentView("auth-login")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-700 hover:text-slate-950 text-xs font-semibold font-mono uppercase tracking-wider cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </button>
                  <button
                    onClick={() => setCurrentView("auth-register")}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm shadow-indigo-500/10"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register
                  </button>
                </div>
              )}

            </div>

          </div>
        </header>
      )}

      {/* Main Core Router content */}
      <div id="view-port-wrapper" className="flex-1 w-full flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (selectedCampaignId || "")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 w-full"
          >
            {loading ? (
              <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <span className="font-mono text-xs text-slate-500 tracking-widest uppercase">Initializing platform...</span>
              </div>
            ) : (
              <>
                {currentView === "home" && (
                  <Home
                    onNavigate={(route) => {
                      if (route === "explore") setCurrentView("explore");
                      else if (route === "register") setCurrentView("auth-register");
                    }}
                    onSelectCampaign={handleSelectCampaign}
                  />
                )}

                {currentView === "explore" && !campaignDetails && (
                  <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                    <div>
                      <span className="text-indigo-600 font-mono text-xs uppercase tracking-widest font-bold">Discover</span>
                      <h2 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight text-slate-900 mt-1">Explore Causes & Innovations</h2>
                      <p className="text-slate-500 mt-2 max-w-2xl font-sans">
                        Browse through our public directory of active pre-seed campaigns looking for community backing. Sign in to contribute platform credits.
                      </p>
                    </div>

                    <div className="bg-slate-100 p-8 rounded-2xl text-center border text-slate-500 text-sm">
                      Please <span className="text-indigo-600 font-bold underline cursor-pointer" onClick={() => setCurrentView("auth-login")}>Sign In</span> or <span className="text-indigo-600 font-bold underline cursor-pointer" onClick={() => setCurrentView("auth-register")}>Register</span> to unlock detailed metrics, file reporting cases, or pledge credits directly.
                    </div>
                  </div>
                )}

                {currentView === "explore" && campaignDetails && (
                  <div className="max-w-7xl mx-auto px-6 py-12">
                    <button
                      onClick={() => {
                        setSelectedCampaignId(null);
                        setCampaignDetails(null);
                        setCurrentView("home");
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer mb-8 transition"
                    >
                      &larr; Back to Landing Page
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm">
                      <div className="md:col-span-8 space-y-6">
                        <img
                          src={campaignDetails.campaign_image_url}
                          alt={campaignDetails.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-72 md:h-96 object-cover rounded-2xl"
                        />
                        <div>
                          <span className="px-3 py-1 bg-slate-150 text-slate-800 text-[10px] font-mono rounded-full uppercase">
                            {campaignDetails.category}
                          </span>
                          <h3 className="font-display font-bold text-2xl md:text-3xl text-slate-900 leading-snug mt-3">
                            {campaignDetails.title}
                          </h3>
                          <p className="text-slate-500 text-xs mt-2">Campaign launched by {campaignDetails.creator_name}</p>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-display font-bold text-base text-slate-900 border-b pb-1">Campaign Story</h4>
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-sans">{campaignDetails.story}</p>
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-xs font-sans">
                          <strong>Pledge Reward Package:</strong> {campaignDetails.reward_info}
                        </div>
                      </div>

                      <div className="md:col-span-4 bg-slate-50 border p-6 rounded-2xl space-y-6">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-400">Total Pre-Seed Raised</span>
                          <span className="font-display font-extrabold text-2xl text-slate-900 block mt-1">
                            {campaignDetails.amount_raised.toLocaleString()} Cr
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Goal: {campaignDetails.funding_goal.toLocaleString()} Credits
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600"
                            style={{ width: `${Math.min(100, (campaignDetails.amount_raised / campaignDetails.funding_goal) * 100)}%` }}
                          />
                        </div>

                        <div className="text-xs font-sans space-y-2 text-slate-600">
                          <div className="flex justify-between border-b pb-2"><span>Min Pledge:</span><strong>{campaignDetails.minimum_contribution} Cr</strong></div>
                          <div className="flex justify-between border-b pb-2"><span>Deadline:</span><strong>{campaignDetails.deadline}</strong></div>
                          <div className="flex justify-between"><span>Verification:</span><strong className="text-indigo-600 uppercase font-mono">{campaignDetails.status}</strong></div>
                        </div>

                        <button
                          onClick={() => setCurrentView("auth-login")}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                          Sign In to Back this Project
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentView === "auth-login" && (
                  <Auth
                    initialMode="login"
                    onAuthSuccess={handleAuthSuccess}
                    onNavigate={(route) => setCurrentView(route === "register" ? "auth-register" : "home")}
                  />
                )}

                {currentView === "auth-register" && (
                  <Auth
                    initialMode="register"
                    onAuthSuccess={handleAuthSuccess}
                    onNavigate={(route) => setCurrentView(route === "login" ? "auth-login" : "home")}
                  />
                )}

                {currentView === "dashboard" && user && token && (
                  <DashboardLayout
                    user={user}
                    token={token}
                    onLogout={handleLogout}
                    onNavigateHome={() => {
                      setCurrentView("home");
                      setSelectedCampaignId(null);
                      setCampaignDetails(null);
                    }}
                    onUpdateCredits={handleUpdateCredits}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Footer (Hidden in workspace Dashboard to maximize room for tabular logs) */}
        {currentView !== "dashboard" && (
          <footer id="global-footer" className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rotate-45"></div>
                  </div>
                  <span className="font-display font-extrabold text-xl tracking-tight">CrowdFund</span>
                </div>
                <p className="text-xs leading-relaxed max-w-sm">
                  Aligning pre-seed finances with environmental and societal innovations. Empowering Creators, rewarding Supporters, and validating transparency.
                </p>
              </div>

              <div className="md:col-span-4 space-y-2">
                <h5 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest">Platform Safety</h5>
                <ul className="text-xs space-y-1.5">
                  <li>Automatic Backer Credit Refunds</li>
                  <li>Admin Campaign Auditing</li>
                  <li>Role-Based Middlewares</li>
                </ul>
              </div>

              {/* Linkable Profile Icons as requested */}
              <div className="md:col-span-3 space-y-3">
                <h5 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest">Connect With Me</h5>
                <div className="flex gap-4">
                  <a
                    href="https://github.com/sumon3210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    title="Developer GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.facebook.com/sumon6122"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    title="Facebook Profile"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-6 text-center text-[10px] font-mono text-slate-500">
              &copy; {new Date().getFullYear()} CrowdFund Platform. Created for infosumon15@gmail.com. Built with React, Express, and Tailwind CSS.
            </div>
          </footer>
        )}
      </div>

    </div>
  );
}

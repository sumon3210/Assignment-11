import React, { useState, useEffect } from "react";
import { LoggedInUser, Campaign, Contribution, PaymentHistoryItem } from "../types";
import { Coins, Heart, Loader2, Search, Filter, ShieldAlert, Check, ChevronLeft, ChevronRight, AlertCircle, Sparkles, CreditCard, Clock, MapPin, Users } from "lucide-react";

interface SupporterDashboardProps {
  user: LoggedInUser;
  token: string;
  onUpdateCredits: (newCredits: number) => void;
}

export default function SupporterDashboard({ user, token, onUpdateCredits }: SupporterDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "contributions" | "purchase" | "history">("home");
  const [stats, setStats] = useState({ totalContributions: 0, totalPending: 0, totalAmountContributed: 0 });
  const [approvedContributions, setApprovedContributions] = useState<Contribution[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Contribution Form
  const [contribAmount, setContribAmount] = useState("");
  const [contribError, setContribError] = useState<string | null>(null);
  const [contribSuccess, setContribSuccess] = useState<string | null>(null);
  const [contribLoading, setContribLoading] = useState(false);

  // Reporting Form
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // My Contributions (Paginated)
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contribsLoading, setContribsLoading] = useState(false);

  // Purchase Credits
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<{ credits: number; price: number } | null>(null);
  const [dummyCard, setDummyCard] = useState("");
  const [dummyCvv, setDummyCvv] = useState("");
  const [dummyExpiry, setDummyExpiry] = useState("");

  // Payment History
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);

  // General Loading
  const [loading, setLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // Fetch Dashboard Stats and Approved Contributions
  const fetchDashboardData = () => {
    setLoading(true);
    fetch("/api/supporter/dashboard", { headers })
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.approvedContributions) setApprovedContributions(data.approvedContributions);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Fetch Campaigns
  const fetchCampaigns = () => {
    fetch("/api/campaigns")
      .then(res => res.json())
      .then(data => setCampaigns(data))
      .catch(err => console.error(err));
  };

  // Fetch My Contributions with pagination
  const fetchMyContributions = (p: number) => {
    setContribsLoading(true);
    fetch(`/api/supporter/contributions?page=${p}&limit=5`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.contributions) setMyContributions(data.contributions);
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
        }
        setContribsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setContribsLoading(false);
      });
  };

  // Fetch Payment History
  const fetchPaymentHistory = () => {
    fetch("/api/supporter/payments", { headers })
      .then(res => res.json())
      .then(data => setPayments(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchDashboardData();
    fetchCampaigns();
  }, [user.credits]);

  useEffect(() => {
    if (activeTab === "contributions") {
      fetchMyContributions(page);
    } else if (activeTab === "history") {
      fetchPaymentHistory();
    }
  }, [activeTab, page]);

  // Handle Contribution submit
  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setContribError(null);
    setContribSuccess(null);

    if (!selectedCampaign) return;
    const amount = Number(contribAmount);
    if (isNaN(amount) || amount <= 0) {
      setContribError("Please enter a valid credit amount.");
      return;
    }

    if (amount < selectedCampaign.minimum_contribution) {
      setContribError(`Minimum contribution is ${selectedCampaign.minimum_contribution} credits.`);
      return;
    }

    if (user.credits < amount) {
      setContribError("Insufficient credits. Please buy credits first.");
      return;
    }

    setContribLoading(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
          contribution_amount: amount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Contribution failed.");

      setContribSuccess("Pledge submitted! Your contribution is pending creator approval.");
      onUpdateCredits(data.remainingCredits);
      setContribAmount("");
      // Refetch campaign details
      fetchCampaignDetails(selectedCampaign.id);
    } catch (err: any) {
      setContribError(err.message);
    } finally {
      setContribLoading(false);
    }
  };

  const fetchCampaignDetails = (id: string) => {
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => setSelectedCampaign(data))
      .catch(err => console.error(err));
  };

  // Handle reporting
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !reportReason) return;

    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/report`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: reportReason })
      });
      if (res.ok) {
        setReportSuccess(true);
        setReportReason("");
        setTimeout(() => setReportSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Stripe purchase
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    if (!dummyCard || !dummyExpiry || !dummyCvv) {
      alert("Please enter your credit card details.");
      return;
    }

    setPurchaseLoading(true);
    setPurchaseSuccess(null);

    try {
      const res = await fetch("/api/supporter/purchase", {
        method: "POST",
        headers,
        body: JSON.stringify({
          credits: selectedPackage.credits,
          amount: selectedPackage.price
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPurchaseSuccess(`Successfully purchased ${selectedPackage.credits} credits!`);
      onUpdateCredits(data.credits);
      setSelectedPackage(null);
      setDummyCard("");
      setDummyExpiry("");
      setDummyCvv("");
    } catch (err: any) {
      alert(err.message || "Payment process failed.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Filters
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.story.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="supporter-dashboard-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar Nav */}
      <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 h-fit space-y-2 shadow-sm">
        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 px-3">
          Supporter Controls
        </h3>
        {[
          { id: "home", label: "Dashboard Home" },
          { id: "explore", label: "Explore Campaigns" },
          { id: "contributions", label: "My Contributions" },
          { id: "purchase", label: "Purchase Credits" },
          { id: "history", label: "Payment History" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedCampaign(null);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-9 space-y-6">

        {activeTab === "home" && (
          <div id="supporter-tab-home" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-xs uppercase tracking-wider block mb-1">
                  Total Contributions
                </span>
                <span className="font-display font-bold text-3xl text-slate-900">
                  {stats.totalContributions}
                </span>
                <span className="text-slate-400 text-xs block mt-2">All pledges submitted</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-xs uppercase tracking-wider block mb-1">
                  Pending Verification
                </span>
                <span className="font-display font-bold text-3xl text-amber-600">
                  {stats.totalPending}
                </span>
                <span className="text-slate-400 text-xs block mt-2">Awaiting creator approval</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-xs uppercase tracking-wider block mb-1">
                  Total Credits Contributed
                </span>
                <span className="font-display font-bold text-3xl text-indigo-600">
                  {stats.totalAmountContributed.toLocaleString()} Cr
                </span>
                <span className="text-slate-400 text-xs block mt-2">Approved transactions</span>
              </div>
            </div>

            {/* Approved Contributions Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Approved Project Contributions
                </h3>
                <p className="text-slate-500 text-xs">These are the campaigns currently using your backed credits.</p>
              </div>

              {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
              ) : approvedContributions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm font-sans">
                  No approved contributions found. Go to <span className="text-indigo-600 underline cursor-pointer" onClick={() => setActiveTab("explore")}>Explore Campaigns</span> to back a project!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                        <th className="p-4">Campaign Title</th>
                        <th className="p-4">Credits Contributed</th>
                        <th className="p-4">Creator Name</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {approvedContributions.map((con) => (
                        <tr key={con.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-900">{con.campaign_title}</td>
                          <td className="p-4 font-mono font-bold text-indigo-600">{con.contribution_amount} Cr</td>
                          <td className="p-4 text-slate-600">{con.creator_name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-semibold uppercase border border-emerald-200">
                              <Check className="w-3 h-3" /> {con.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "explore" && !selectedCampaign && (
          <div id="supporter-tab-explore" className="space-y-6">
            {/* Search/Filter bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns by keyword..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl outline-none text-sm text-slate-900"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto shrink-0">
                {["All", "Technology", "Art", "Community", "Health"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Cards */}
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
                No active approved campaigns found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCampaigns.map((camp) => {
                  const pct = Math.min(100, Math.round((camp.amount_raised / camp.funding_goal) * 100));
                  return (
                    <div key={camp.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between h-full">
                      <div className="relative h-44 bg-slate-50">
                        <img
                          src={camp.campaign_image_url}
                          alt={camp.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-4 left-4 px-2.5 py-1 bg-slate-900/80 text-white text-[10px] font-mono rounded-full uppercase">
                          {camp.category}
                        </span>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-display font-bold text-lg text-slate-900 mb-2 leading-snug line-clamp-2">
                            {camp.title}
                          </h4>
                          <p className="text-slate-500 text-xs font-mono mb-3">By {camp.creator_name}</p>
                          <p className="text-slate-600 text-sm line-clamp-3 mb-4">{camp.story}</p>
                        </div>

                        <div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
                          </div>

                          <div className="flex justify-between items-center font-mono text-[10px] text-slate-500 mb-4">
                            <span>{camp.amount_raised.toLocaleString()} Raised</span>
                            <span>Goal: {camp.funding_goal.toLocaleString()}</span>
                          </div>

                          <button
                            onClick={() => setSelectedCampaign(camp)}
                            className="w-full py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            View Details & Contribute
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Campaign Details Subview */}
        {selectedCampaign && (
          <div id="supporter-campaign-detail" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
            <button
              onClick={() => setSelectedCampaign(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              &larr; Back to Campaigns
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-7 space-y-6">
                <img
                  src={selectedCampaign.campaign_image_url}
                  alt={selectedCampaign.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-64 md:h-80 object-cover rounded-2xl"
                />
                <div>
                  <h3 className="font-display font-bold text-2xl text-slate-900 leading-tight">
                    {selectedCampaign.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 items-center text-xs text-slate-500 font-mono mt-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full uppercase">
                      {selectedCampaign.category}
                    </span>
                    <span>Created by: {selectedCampaign.creator_name}</span>
                    <span>Deadline: {selectedCampaign.deadline}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-display font-bold text-lg text-slate-900 border-b pb-2">
                    Campaign Story
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-sans">
                    {selectedCampaign.story}
                  </p>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-2">
                  <h5 className="font-display font-bold text-indigo-900 text-sm">
                    Pledge Rewards Information
                  </h5>
                  <p className="text-indigo-950 text-xs font-sans leading-relaxed">
                    {selectedCampaign.reward_info}
                  </p>
                </div>
              </div>

              {/* Sidebar Contribution Panel */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6">
                  <div>
                    <span className="font-mono text-xs uppercase text-slate-400">Total Raised</span>
                    <span className="font-display font-bold text-3xl text-slate-900 block mt-1">
                      {selectedCampaign.amount_raised.toLocaleString()} Cr
                    </span>
                    <span className="text-xs text-slate-500">
                      Funding Goal: {selectedCampaign.funding_goal.toLocaleString()} Cr
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${Math.min(100, (selectedCampaign.amount_raised / selectedCampaign.funding_goal) * 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] block">Min Pledge</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedCampaign.minimum_contribution} Cr</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] block">Status</span>
                      <span className="font-bold text-indigo-600 text-sm uppercase">{selectedCampaign.status}</span>
                    </div>
                  </div>

                  {/* Contribution Form */}
                  <form onSubmit={handleContribute} className="border-t border-slate-200 pt-6 space-y-4">
                    <h5 className="font-display font-bold text-sm text-slate-900">Support this Cause</h5>
                    
                    {contribError && <div className="text-rose-600 text-xs font-semibold">{contribError}</div>}
                    {contribSuccess && <div className="text-indigo-600 text-xs font-semibold">{contribSuccess}</div>}

                    <div>
                      <label className="block text-slate-600 text-xs font-mono uppercase mb-1.5">
                        Amount to Contribute (Credits)
                      </label>
                      <input
                        type="number"
                        min={selectedCampaign.minimum_contribution}
                        required
                        value={contribAmount}
                        onChange={(e) => setContribAmount(e.target.value)}
                        placeholder={`Min ${selectedCampaign.minimum_contribution} credits`}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contribLoading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex justify-center items-center gap-1.5"
                    >
                      {contribLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Contribution"}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center">
                      Funds are held securely. Cancelable until approved.
                    </p>
                  </form>
                </div>

                {/* Report Campaign widget */}
                <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-rose-800">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <h5 className="font-display font-bold text-sm">Report Campaign</h5>
                  </div>
                  <p className="text-rose-950 text-xs font-sans leading-relaxed">
                    If you suspect this campaign violates rules, is fraudulent, or contains copyrighted material, report it below for Admin review.
                  </p>

                  {reportSuccess ? (
                    <div className="text-rose-700 text-xs font-semibold">Report successfully filed. Thank you for making our platform secure!</div>
                  ) : (
                    <form onSubmit={handleReport} className="space-y-3">
                      <textarea
                        required
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="State your reasons clearly..."
                        rows={3}
                        className="w-full p-3 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:border-rose-500"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition"
                      >
                        Submit Report
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contributions" && (
          <div id="supporter-tab-contributions" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Pledge & Contribution History
              </h3>
              <p className="text-slate-500 text-xs">Track your active or historical credit contributions across projects.</p>
            </div>

            {contribsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
            ) : myContributions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">You haven't contributed to any campaign yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                        <th className="p-4">Campaign Title</th>
                        <th className="p-4">Amount Pledged</th>
                        <th className="p-4">Pledge Date</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {myContributions.map((con) => (
                        <tr key={con.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-900">{con.campaign_title}</td>
                          <td className="p-4 font-mono font-bold text-indigo-600">{con.contribution_amount} Cr</td>
                          <td className="p-4 text-slate-500 font-mono text-xs">{con.current_date}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase border ${
                              con.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : con.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {con.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between font-mono text-xs text-slate-500">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "purchase" && (
          <div id="supporter-tab-purchase" className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                Purchase Platform Credits
              </h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Credits are your ticket to backing projects on CrowdFund. Credits are purchased securely via Stripe integration. 10 Credits are worth exactly 1 US Dollar.
              </p>

              {purchaseSuccess && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl mb-8 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  {purchaseSuccess}
                </div>
              )}

              {/* Package cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { credits: 100, price: 10, tag: "Starter Pack" },
                  { credits: 300, price: 25, tag: "Standard Value" },
                  { credits: 800, price: 60, tag: "Supporter Core" },
                  { credits: 1500, price: 110, tag: "Elite Angel" }
                ].map((pkg) => (
                  <button
                    key={pkg.credits}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setPurchaseSuccess(null);
                    }}
                    className={`p-6 border rounded-2xl text-left cursor-pointer transition flex flex-col justify-between h-44 ${
                      selectedPackage?.credits === pkg.credits
                        ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 hover:border-indigo-500/40"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold tracking-wider uppercase block mb-1">
                        {pkg.tag}
                      </span>
                      <span className="font-display font-extrabold text-2xl text-slate-900 block">
                        {pkg.credits} Cr
                      </span>
                    </div>
                    <div className="flex justify-between items-end w-full">
                      <span className="font-mono text-slate-400 text-xs">Stripe Checkout</span>
                      <span className="font-display font-bold text-lg text-slate-900">${pkg.price}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Checkout modal/form */}
              {selectedPackage && (
                <form onSubmit={handlePurchase} className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-lg space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 border-b pb-3 mb-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-display font-bold text-sm">Stripe Payment Gateway</h4>
                  </div>
                  <div className="font-mono text-xs text-slate-600">
                    Purchasing <strong className="text-slate-900">{selectedPackage.credits} Credits</strong> for <strong className="text-slate-900">${selectedPackage.price}.00 USD</strong>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-600 text-[10px] font-mono uppercase mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={dummyCard}
                        onChange={(e) => setDummyCard(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 text-[10px] font-mono uppercase mb-1">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={dummyExpiry}
                          onChange={(e) => setDummyExpiry(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[10px] font-mono uppercase mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          maxLength={3}
                          value={dummyCvv}
                          onChange={(e) => setDummyCvv(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={purchaseLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {purchaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay $${selectedPackage.price} & Secure Credits`}
                  </button>
                  <p className="text-[9px] text-slate-400 text-center font-mono">
                    Transactions are processed immediately using Sandbox test-keys.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div id="supporter-tab-history" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Credit Purchase & Payment Invoices
              </h3>
              <p className="text-slate-500 text-xs">Official receipts for credit loading via Stripe Payments.</p>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No credit purchases recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                      <th className="p-4">Invoice ID</th>
                      <th className="p-4">Loaded Credits</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4">Transaction Date</th>
                      <th className="p-4">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono text-xs text-slate-500">{p.id}</td>
                        <td className="p-4 font-mono font-bold text-slate-900">+{p.credits} Credits</td>
                        <td className="p-4 font-mono font-semibold text-slate-900">${p.amount}.00 USD</td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{p.date}</td>
                        <td className="p-4 text-slate-600 font-mono text-xs">Stripe Direct</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { LoggedInUser, Campaign, Contribution, Withdrawal } from "../types";
import { Loader2, Plus, Calendar, Coins, ArrowUpRight, DollarSign, Edit, Trash2, Camera, ShieldAlert, Check, X, FileText } from "lucide-react";

interface CreatorDashboardProps {
  user: LoggedInUser;
  token: string;
  onUpdateCredits: (newCredits: number) => void;
}

export default function CreatorDashboard({ user, token, onUpdateCredits }: CreatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "add" | "my-campaigns" | "withdraw" | "history">("home");
  const [stats, setStats] = useState({ totalCampaigns: 0, activeCampaigns: 0, totalAmountRaised: 0 });
  const [pendingContributions, setPendingContributions] = useState<Contribution[]>([]);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);

  // Add Campaign Form States
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("Technology");
  const [fundingGoal, setFundingGoal] = useState("");
  const [minContribution, setMinContribution] = useState("");
  const [deadline, setDeadline] = useState("");
  const [rewardInfo, setRewardInfo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // My Campaigns
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  
  // Edit Campaign Modal
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStory, setEditStory] = useState("");
  const [editReward, setEditReward] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Withdrawal Section
  const [earnings, setEarnings] = useState({ totalRaisedCredits: 0, availableCredits: 0, withdrawnDollars: 0 });
  const [withdrawCredits, setWithdrawCredits] = useState("");
  const [withdrawSystem, setWithdrawSystem] = useState("Stripe");
  const [accountNo, setAccountNo] = useState("");
  const [withdrawHistory, setWithdrawHistory] = useState<Withdrawal[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const fetchCreatorHome = () => {
    fetch("/api/creator/dashboard", { headers })
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.pendingContributions) setPendingContributions(data.pendingContributions);
      })
      .catch(err => console.error(err));
  };

  const fetchMyCampaigns = () => {
    setCampaignsLoading(true);
    fetch("/api/creator/campaigns", { headers })
      .then(res => res.json())
      .then(data => {
        setMyCampaigns(data);
        setCampaignsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setCampaignsLoading(false);
      });
  };

  const fetchWithdrawData = () => {
    fetch("/api/creator/withdrawals", { headers })
      .then(res => res.json())
      .then(data => {
        if (data.earnings) setEarnings(data.earnings);
        if (data.withdrawals) setWithdrawHistory(data.withdrawals);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchCreatorHome();
  }, [user.credits]);

  useEffect(() => {
    if (activeTab === "my-campaigns") {
      fetchMyCampaigns();
    } else if (activeTab === "withdraw") {
      fetchWithdrawData();
    } else if (activeTab === "history") {
      fetchWithdrawData();
    }
  }, [activeTab]);

  // Handle local compression/upload (Image to Base64)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setImageUrl(data.url);
        } else {
          setFormError(data.error || "Failed to parse image cover");
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setFormError("Failed to convert image. Choose another smaller one.");
      setUploadingImage(false);
    }
  };

  // Add Campaign Submit
  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title || !story || !fundingGoal || !minContribution || !deadline || !rewardInfo) {
      setFormError("All required fields must be completed.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          story,
          category,
          funding_goal: Number(fundingGoal),
          minimum_contribution: Number(minContribution),
          deadline,
          reward_info: rewardInfo,
          campaign_image_url: imageUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Campaign launch failed.");

      setFormSuccess("Campaign submitted successfully! Pending Administrator approval.");
      setTitle("");
      setStory("");
      setFundingGoal("");
      setMinContribution("");
      setDeadline("");
      setRewardInfo("");
      setImageUrl("");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Contribution Approvals / Rejections
  const handleApproveContribution = async (id: string) => {
    try {
      const res = await fetch(`/api/contributions/${id}/approve`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        setSelectedContribution(null);
        fetchCreatorHome();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectContribution = async (id: string) => {
    try {
      const res = await fetch(`/api/contributions/${id}/reject`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        setSelectedContribution(null);
        fetchCreatorHome();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Campaign Update (Modal Save)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: editTitle,
          story: editStory,
          reward_info: editReward
        })
      });
      if (res.ok) {
        setEditingCampaign(null);
        fetchMyCampaigns();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  // Campaign Delete (Triggers Automatic refunds)
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? All approved contributors will be automatically refunded!")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        fetchMyCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Withdrawal Submit
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const creds = Number(withdrawCredits);
    if (isNaN(creds) || creds < 200) {
      setWithdrawError("Minimum withdrawal is 200 credits.");
      return;
    }

    if (creds > earnings.availableCredits) {
      setWithdrawError("Insufficient available credit.");
      return;
    }

    if (!accountNo) {
      setWithdrawError("Account number/address is required.");
      return;
    }

    setWithdrawLoading(true);
    try {
      const res = await fetch("/api/creator/withdraw", {
        method: "POST",
        headers,
        body: JSON.stringify({
          credits: creds,
          paymentSystem: withdrawSystem,
          accountNumber: accountNo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWithdrawSuccess("Withdrawal request submitted! Pending administrator processing.");
      setWithdrawCredits("");
      setAccountNo("");
      fetchWithdrawData();
    } catch (err: any) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Business logic auto dollar converter (20 Cr = $1 USD)
  const calculatedDollarAmount = Number(withdrawCredits) ? Number(withdrawCredits) / 20 : 0;

  return (
    <div id="creator-dashboard-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar Controls */}
      <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 h-fit space-y-2 shadow-sm">
        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 px-3">
          Creator Panel
        </h3>
        {[
          { id: "home", label: "Dashboard Home" },
          { id: "add", label: "Launch Campaign" },
          { id: "my-campaigns", label: "My Campaigns" },
          { id: "withdraw", label: "Withdraw Funds" },
          { id: "history", label: "Payment History" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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

      {/* Main Panel Content */}
      <div className="lg:col-span-9 space-y-6">

        {activeTab === "home" && (
          <div id="creator-tab-home" className="space-y-6">
            
            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-xs uppercase block mb-1">
                  Campaigns Launched
                </span>
                <span className="font-display font-bold text-3xl text-slate-900">
                  {stats.totalCampaigns}
                </span>
                <span className="text-slate-400 text-xs block mt-2">All submissions logged</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-xs uppercase block mb-1">
                  Active Campaigns
                </span>
                <span className="font-display font-bold text-3xl text-emerald-600">
                  {stats.activeCampaigns}
                </span>
                <span className="text-slate-400 text-xs block mt-2">Unexpired and approved</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-xs uppercase block mb-1">
                  Cumulative Raised
                </span>
                <span className="font-display font-bold text-3xl text-indigo-600">
                  {stats.totalAmountRaised.toLocaleString()} Cr
                </span>
                <span className="text-slate-400 text-xs block mt-2">Across all campaigns</span>
              </div>
            </div>

            {/* Contributions to Review */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Pledge Contributions to Review
                </h3>
                <p className="text-slate-500 text-xs">Review pending supporter stakes. Approving adds credits to your campaign fund; rejecting returns credits to supporters.</p>
              </div>

              {pendingContributions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  No pending contributions to review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                        <th className="p-4">Supporter</th>
                        <th className="p-4">Campaign Target</th>
                        <th className="p-4">Staked Amount</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {pendingContributions.map((con) => (
                        <tr key={con.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-900">{con.supporter_name}</td>
                          <td className="p-4 text-slate-600">{con.campaign_title}</td>
                          <td className="p-4 font-mono font-bold text-indigo-600">{con.contribution_amount} Cr</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedContribution(con)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
                            >
                              Review & Act
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Detail for Reviewing Pledges */}
            {selectedContribution && (
              <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative border border-slate-200">
                  <button
                    onClick={() => setSelectedContribution(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                  >
                    &times;
                  </button>
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Contribution Detailed Review
                    </h3>
                    <p className="text-slate-400 text-xs">Authorize or refuse supporter credit transfer.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-3 font-sans">
                    <div className="flex justify-between border-b pb-2"><span className="text-slate-400">Supporter Name</span><span className="font-semibold text-slate-800">{selectedContribution.supporter_name}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-slate-400">Email Address</span><span className="font-mono text-slate-800">{selectedContribution.supporter_email}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-slate-400">Target Campaign</span><span className="font-semibold text-slate-800 max-w-[200px] text-right truncate">{selectedContribution.campaign_title}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-slate-400">Submitted Date</span><span className="font-mono text-slate-800">{selectedContribution.current_date}</span></div>
                    <div className="flex justify-between pt-1"><span className="text-slate-400 font-bold">Staked Amount</span><span className="font-mono font-bold text-teal-600 text-sm">{selectedContribution.contribution_amount} Credits</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleRejectContribution(selectedContribution.id)}
                      className="py-3 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Reject & Refund
                    </button>
                    <button
                      onClick={() => handleApproveContribution(selectedContribution.id)}
                      className="py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Approve & Collect
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "add" && (
          <div id="creator-tab-add" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              Launch a New Campaign
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Design your project and state your pre-seed milestones clearly. New campaigns require Administrative review and approval before becoming discoverable to Supporters.
            </p>

            {formError && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl mb-6">{formError}</div>}
            {formSuccess && <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-xl mb-6">{formSuccess}</div>}

            <form onSubmit={handleAddCampaign} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Help us build a solar-powered water pump"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option>Technology</option>
                    <option>Art</option>
                    <option>Community</option>
                    <option>Health</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Campaign Story & Details</label>
                <textarea
                  required
                  rows={5}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Provide a compelling narrative of your project, technical specs, and how you will allocate pre-seed funds..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Funding Goal (Credits)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value)}
                    placeholder="ex: 5000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Min Contribution (Credits)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={minContribution}
                    onChange={(e) => setMinContribution(e.target.value)}
                    placeholder="ex: 20"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Reward Info (Supporter Tiers)</label>
                <input
                  type="text"
                  required
                  value={rewardInfo}
                  onChange={(e) => setRewardInfo(e.target.value)}
                  placeholder="ex: Solar Pump Sticker Pack + Circuit Blueprints for pledges over 50 Credits"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Cover Image Upload (Base64 integration challenge) */}
              <div>
                <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-2">Campaign Cover Image</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Cover Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="campaign-cover-uploader"
                      className="hidden"
                    />
                    <label
                      htmlFor="campaign-cover-uploader"
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs border border-slate-200 rounded-xl cursor-pointer"
                    >
                      Choose Cover Image
                    </label>
                    <p className="text-[10px] text-slate-400 mt-2">
                      High resolution landscapes work best. Automatically formatted to fit card standards.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading || uploadingImage}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Launch Campaign for Review"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "my-campaigns" && (
          <div id="creator-tab-my-campaigns" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                My Launched Campaigns
              </h3>
              <p className="text-slate-500 text-xs">Manage updates, modify rewards, or safely dismantle your project timelines.</p>
            </div>

            {campaignsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
            ) : myCampaigns.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">You haven't launched any campaign yet. Go to <span className="text-indigo-600 underline cursor-pointer font-semibold" onClick={() => setActiveTab("add")}>Launch Campaign</span>!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                      <th className="p-4">Campaign Title</th>
                      <th className="p-4">Goal / Raised</th>
                      <th className="p-4">Deadline</th>
                      <th className="p-4">Approval Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {myCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/50">
                        <td className="p-4 max-w-[220px]">
                          <span className="font-semibold text-slate-900 block truncate">{camp.title}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{camp.category}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs text-slate-500">Goal: {camp.funding_goal.toLocaleString()} Cr</span>
                          <span className="font-mono font-bold text-indigo-600 block">{camp.amount_raised.toLocaleString()} Raised</span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{camp.deadline}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${
                            camp.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : camp.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCampaign(camp);
                                setEditTitle(camp.title);
                                setEditStory(camp.story);
                                setEditReward(camp.reward_info);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Campaign Editor Modal */}
            {editingCampaign && (
              <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-6">
                <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-4 shadow-2xl relative border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingCampaign(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                  >
                    &times;
                  </button>
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Edit Campaign Details
                    </h3>
                    <p className="text-slate-400 text-xs">Modify parameters for approved project: {editingCampaign.title}</p>
                  </div>

                  <div className="space-y-4 font-sans">
                    <div>
                      <label className="block text-slate-600 text-xs font-mono uppercase mb-1">Campaign Title</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-mono uppercase mb-1">Campaign Story</label>
                      <textarea
                        required
                        rows={4}
                        value={editStory}
                        onChange={(e) => setEditStory(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-mono uppercase mb-1">Rewards Information</label>
                      <input
                        type="text"
                        required
                        value={editReward}
                        onChange={(e) => setEditReward(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingCampaign(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl cursor-pointer transition flex items-center gap-1.5"
                    >
                      {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "withdraw" && (
          <div id="creator-tab-withdraw" className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                Withdraw Raised Funds
              </h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Creators earn when contributions accumulate. Creators withdraw 1 US Dollar for every 20 credits raised. Minimum payout eligibility is 200 credits ($10).
              </p>

              {/* Earnings overview cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-50 border p-5 rounded-2xl">
                  <span className="text-slate-400 text-xs font-mono uppercase block mb-1">Cumulative Raised</span>
                  <span className="font-display font-extrabold text-2xl text-slate-900 block">{earnings.totalRaisedCredits} Credits</span>
                  <span className="text-[10px] text-slate-400 block mt-1">From all approved campaigns</span>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl">
                  <span className="text-indigo-600 text-xs font-mono uppercase block mb-1">Available to Withdraw</span>
                  <span className="font-display font-extrabold text-2xl text-indigo-800 block">{earnings.availableCredits} Credits</span>
                  <span className="text-[10px] text-indigo-600 block mt-1">Awaiting your payout requests</span>
                </div>
                <div className="bg-slate-50 border p-5 rounded-2xl">
                  <span className="text-slate-400 text-xs font-mono uppercase block mb-1">Total Paid Earnings</span>
                  <span className="font-display font-extrabold text-2xl text-slate-900 block">${earnings.withdrawnDollars}.00</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Processed to date in dollars</span>
                </div>
              </div>

              {/* Withdrawal Request Form */}
              {earnings.availableCredits < 200 ? (
                <div className="p-6 bg-slate-50 border border-dashed rounded-2xl text-center text-slate-500 text-sm font-sans">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <strong>Insufficient credit</strong>. You need at least 200 credits in campaign funds before submitting a withdrawal request.
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="bg-slate-50 border p-6 rounded-2xl max-w-lg space-y-4">
                  <div className="flex items-center gap-1.5 text-slate-800 border-b pb-3 mb-2">
                    <Coins className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-display font-bold text-sm">Withdrawal Payout Request</h4>
                  </div>

                  {withdrawError && <div className="text-rose-600 text-xs font-semibold">{withdrawError}</div>}
                  {withdrawSuccess && <div className="text-indigo-600 text-xs font-semibold">{withdrawSuccess}</div>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 text-[10px] font-mono uppercase mb-1">Credits To Withdraw</label>
                      <input
                        type="number"
                        min={200}
                        max={earnings.availableCredits}
                        required
                        value={withdrawCredits}
                        onChange={(e) => setWithdrawCredits(e.target.value)}
                        placeholder="Min 200 credits"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] font-mono uppercase mb-1">Withdraw Amount ($)</label>
                      <input
                        type="text"
                        readOnly
                        value={`$${calculatedDollarAmount.toFixed(2)} USD`}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold font-mono text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 text-[10px] font-mono uppercase mb-1">Payment Method</label>
                      <select
                        value={withdrawSystem}
                        onChange={(e) => setWithdrawSystem(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      >
                        <option>Stripe</option>
                        <option>bKash</option>
                        <option>Rocket</option>
                        <option>Nagad</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] font-mono uppercase mb-1">Account Number / Key</label>
                      <input
                        type="text"
                        required
                        value={accountNo}
                        onChange={(e) => setAccountNo(e.target.value)}
                        placeholder="ex: +8801XXXXX or Stripe account link"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs uppercase rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "File Payout Claim"}
                  </button>
                  <p className="text-[9px] text-slate-400 text-center font-mono">
                    Claims are audited. Payments are processed within 24-48 business hours.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div id="creator-tab-history" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Withdrawal Payment History
              </h3>
              <p className="text-slate-500 text-xs">A comprehensive log of payout transfers disbursed and pending reviews.</p>
            </div>

            {withdrawHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No withdrawal payouts filed yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Withdrawn Credits</th>
                      <th className="p-4">Payout Value ($)</th>
                      <th className="p-4">Payment System</th>
                      <th className="p-4">Disbursed Date</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {withdrawHistory.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono text-xs text-slate-500">{w.id}</td>
                        <td className="p-4 font-mono text-slate-900">-{w.withdrawal_credit} Credits</td>
                        <td className="p-4 font-mono font-bold text-slate-900">${w.withdrawal_amount}.00 USD</td>
                        <td className="p-4 text-slate-600 font-semibold">{w.payment_system} ({w.account_number})</td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{w.withdraw_date}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${
                            w.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {w.status}
                          </span>
                        </td>
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

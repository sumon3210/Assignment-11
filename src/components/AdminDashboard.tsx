import React, { useState, useEffect } from "react";
import { LoggedInUser, Campaign, Withdrawal, UserManageItem, CampaignReport } from "../types";
import { Loader2, Users, Coins, HelpCircle, Check, X, ShieldAlert, AlertTriangle, Trash2, Edit } from "lucide-react";

interface AdminDashboardProps {
  user: LoggedInUser;
  token: string;
}

export default function AdminDashboard({ user, token }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "approvals" | "withdrawals" | "users" | "campaigns" | "reports">("home");
  const [stats, setStats] = useState({ totalSupporters: 0, totalCreators: 0, totalAvailableCredits: 0, totalPaymentsProcessed: 0 });
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<UserManageItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reports, setReports] = useState<CampaignReport[]>([]);

  const [loading, setLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const fetchAdminStats = () => {
    fetch("/api/admin/dashboard", { headers })
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
      })
      .catch(err => console.error(err));
  };

  const fetchPendingCampaigns = () => {
    fetch("/api/admin/campaigns/pending", { headers })
      .then(res => res.json())
      .then(data => setPendingCampaigns(data))
      .catch(err => console.error(err));
  };

  const fetchPendingWithdrawals = () => {
    fetch("/api/admin/withdrawals/pending", { headers })
      .then(res => res.json())
      .then(data => setPendingWithdrawals(data))
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    fetch("/api/admin/users", { headers })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

  const fetchCampaigns = () => {
    fetch("/api/admin/campaigns", { headers })
      .then(res => res.json())
      .then(data => setCampaigns(data))
      .catch(err => console.error(err));
  };

  const fetchReports = () => {
    fetch("/api/admin/reports", { headers })
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchAdminStats();
    fetchPendingCampaigns();
    fetchPendingWithdrawals();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "campaigns") fetchCampaigns();
    else if (activeTab === "reports") fetchReports();
  }, [activeTab]);

  // Campaign Approvals
  const handleCampaignApproval = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/status`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchPendingCampaigns();
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Withdrawal approvals
  const handleWithdrawalApproval = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        fetchPendingWithdrawals();
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manage Users
  const handleRoleChange = async (email: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${email}/role`, {
        method: "POST",
        headers,
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!confirm(`Are you absolutely sure you want to remove user ${email}? This action is irreversible!`)) return;
    try {
      const res = await fetch(`/api/admin/users/${email}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        fetchUsers();
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Campaign (Admin side)
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? All approved contributors will be automatically refunded!")) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        if (activeTab === "campaigns") fetchCampaigns();
        else if (activeTab === "reports") fetchReports();
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="admin-dashboard-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar Navigation */}
      <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 h-fit space-y-2 shadow-sm">
        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 px-3">
          Admin Control Hub
        </h3>
        {[
          { id: "home", label: "Operations Panel" },
          { id: "approvals", label: "Campaign Approvals" },
          { id: "withdrawals", label: "Withdrawal Requests" },
          { id: "users", label: "Manage Users" },
          { id: "campaigns", label: "Manage Campaigns" },
          { id: "reports", label: "Suspicion Reports" }
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

      {/* Main Panel */}
      <div className="lg:col-span-9 space-y-6">

        {activeTab === "home" && (
          <div id="admin-tab-home" className="space-y-6">
            
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">Total Supporters</span>
                <span className="font-display font-bold text-3xl text-slate-900">{stats.totalSupporters}</span>
                <span className="text-[10px] text-slate-400 block mt-2">Active credit buyers</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">Total Creators</span>
                <span className="font-display font-bold text-3xl text-slate-900">{stats.totalCreators}</span>
                <span className="text-[10px] text-slate-400 block mt-2">Campaign creators</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">Circulating Credits</span>
                <span className="font-display font-bold text-3xl text-indigo-600">{stats.totalAvailableCredits.toLocaleString()} Cr</span>
                <span className="text-[10px] text-slate-400 block mt-2">Sum of all users' credits</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">Processed Payouts</span>
                <span className="font-display font-bold text-3xl text-emerald-600">${stats.totalPaymentsProcessed.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block mt-2">Disbursed to creators</span>
              </div>
            </div>

            {/* Quick overview of pending approvals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Campaign Approvals widget */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h4 className="font-display font-bold text-base text-slate-900">Pending Campaigns</h4>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-mono text-xs rounded-full border border-amber-200">{pendingCampaigns.length} review(s)</span>
                </div>
                {pendingCampaigns.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">All submitted campaigns are up-to-date.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingCampaigns.slice(0, 3).map(c => (
                      <div key={c.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <strong className="text-slate-800 font-semibold block truncate max-w-[180px]">{c.title}</strong>
                          <span className="text-[10px] text-slate-400 uppercase">By {c.creator_name}</span>
                        </div>
                        <button
                          onClick={() => setActiveTab("approvals")}
                          className="px-3 py-1 bg-indigo-600 text-white font-bold text-[10px] uppercase rounded-lg transition"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Withdrawal Approvals widget */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h4 className="font-display font-bold text-base text-slate-900">Pending Withdrawals</h4>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-mono text-xs rounded-full border border-amber-200">{pendingWithdrawals.length} request(s)</span>
                </div>
                {pendingWithdrawals.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">No pending creator payouts.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingWithdrawals.slice(0, 3).map(w => (
                      <div key={w.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <strong className="text-slate-800 font-bold block">-{w.withdrawal_credit} Credits</strong>
                          <span className="text-[10px] text-slate-400 uppercase">Payout: ${w.withdrawal_amount}</span>
                        </div>
                        <button
                          onClick={() => setActiveTab("withdrawals")}
                          className="px-3 py-1 bg-indigo-600 text-white font-bold text-[10px] uppercase rounded-lg transition"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div id="admin-tab-approvals" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Campaign Verification Approvals
              </h3>
              <p className="text-slate-500 text-xs">Verify newly launched pre-seed projects before making them public to supporters.</p>
            </div>

            {pendingCampaigns.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No campaigns awaiting verification.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                      <th className="p-4">Campaign Title</th>
                      <th className="p-4">Creator / Email</th>
                      <th className="p-4">Goal Credits</th>
                      <th className="p-4 text-center">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {pendingCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/50">
                        <td className="p-4 max-w-sm">
                          <span className="font-semibold text-slate-900 block leading-snug">{camp.title}</span>
                          <span className="text-slate-500 text-xs line-clamp-2 mt-1">{camp.story}</span>
                          <span className="text-[10px] text-indigo-600 uppercase font-mono mt-2 block">Min Contribution: {camp.minimum_contribution} Credits</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{camp.creator_name}</span>
                          <span className="text-slate-400 font-mono text-xs">{camp.creator_email}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">{camp.funding_goal.toLocaleString()} Cr</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCampaignApproval(camp.id, "rejected")}
                              className="px-2.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleCampaignApproval(camp.id, "approved")}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "withdrawals" && (
          <div id="admin-tab-withdrawals" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Creator Withdrawal Payout Requests
              </h3>
              <p className="text-slate-500 text-xs">Disburse earnings to creators. Click Payment Success upon validating and issuing bank/stripe payments.</p>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No payout requests pending.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                      <th className="p-4">Creator / Info</th>
                      <th className="p-4">Transferred Credits</th>
                      <th className="p-4">Disbursed Payout ($)</th>
                      <th className="p-4">Gateway Address</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {pendingWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{w.creator_name}</span>
                          <span className="text-slate-400 text-xs font-mono">{w.creator_email}</span>
                          <span className="text-[10px] text-slate-400 block mt-1">Requested: {w.withdraw_date}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">-{w.withdrawal_credit} Credits</td>
                        <td className="p-4 font-mono font-bold text-emerald-600">${w.withdrawal_amount}.00 USD</td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded mb-1">{w.payment_system}</span>
                          <span className="block font-mono text-xs text-slate-500">{w.account_number}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleWithdrawalApproval(w.id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer transition flex items-center justify-center gap-1 mx-auto"
                          >
                            <Check className="w-3.5 h-3.5" /> Payment Success
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div id="admin-tab-users" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                User Directory & Role Configuration
              </h3>
              <p className="text-slate-500 text-xs">Oversee platform roles, adjust permissions, or remove accounts.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">System Role</th>
                    <th className="p-4">Credits Balance</th>
                    <th className="p-4 text-center">Manage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.photoUrl}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border bg-slate-50"
                          />
                          <span className="font-bold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600 text-xs">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.email, e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none text-slate-800"
                        >
                          <option>Supporter</option>
                          <option>Creator</option>
                          <option>Admin</option>
                        </select>
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-800">{u.credits} Cr</td>
                      <td className="p-4 text-center">
                        {u.email.toLowerCase() === user.email.toLowerCase() ? (
                          <span className="text-[10px] text-slate-400 font-mono uppercase">You</span>
                        ) : (
                          <button
                            onClick={() => handleRemoveUser(u.email)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "campaigns" && (
          <div id="admin-tab-campaigns" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Master Campaign Directory
              </h3>
              <p className="text-slate-500 text-xs">Monitor running projects, auditing goals, and removing fraudulent profiles.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                    <th className="p-4">Campaign Information</th>
                    <th className="p-4">Goal / Raised</th>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Purge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/50">
                      <td className="p-4 max-w-sm">
                        <span className="font-bold text-slate-900 block leading-snug">{camp.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{camp.category}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs text-slate-500 block">Goal: {camp.funding_goal.toLocaleString()} Cr</span>
                        <span className="font-mono font-bold text-indigo-600">{camp.amount_raised.toLocaleString()} Raised</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-700 block">{camp.creator_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{camp.creator_email}</span>
                      </td>
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
                        <button
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div id="admin-tab-reports" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Fraud & Suspicion Reports
              </h3>
              <p className="text-slate-500 text-xs">Verify complaints raised by supporters regarding fraudulent activities.</p>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No fraud reports recorded. Excellent platform health!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase text-slate-500">
                      <th className="p-4">Reported Campaign</th>
                      <th className="p-4">Reporter Information</th>
                      <th className="p-4">Violation Details / Reason</th>
                      <th className="p-4">Date Filed</th>
                      <th className="p-4 text-center">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/50 bg-rose-50/10">
                        <td className="p-4 font-bold text-slate-900">{rep.campaign_title}</td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{rep.reporter_name}</span>
                          <span className="text-slate-400 font-mono text-xs">{rep.reporter_email}</span>
                        </td>
                        <td className="p-4 text-rose-950 bg-rose-50/40 font-medium text-xs max-w-xs leading-relaxed p-3 rounded-lg border border-rose-100">
                          {rep.reason}
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{rep.date}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteCampaign(rep.campaign_id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1 mx-auto"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Suspend & Refund
                          </button>
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

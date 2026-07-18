export type UserRole = "Supporter" | "Creator" | "Admin";

export interface LoggedInUser {
  name: string;
  email: string;
  photoUrl: string;
  role: UserRole;
  credits: number;
}

export interface Campaign {
  id: string;
  title: string;
  story: string;
  category: string;
  funding_goal: number;
  minimum_contribution: number;
  deadline: string;
  reward_info: string;
  campaign_image_url: string;
  creator_name: string;
  creator_email: string;
  status: "pending" | "approved" | "rejected";
  amount_raised: number;
}

export interface Contribution {
  id: string;
  campaign_id: string;
  campaign_title: string;
  contribution_amount: number;
  supporter_email: string;
  supporter_name: string;
  creator_name: string;
  creator_email: string;
  current_date: string;
  status: "pending" | "approved" | "rejected";
}

export interface Withdrawal {
  id: string;
  creator_email: string;
  creator_name: string;
  withdrawal_credit: number;
  withdrawal_amount: number;
  payment_system: string;
  account_number: string;
  withdraw_date: string;
  status: "pending" | "approved";
}

export interface PaymentHistoryItem {
  id: string;
  supporter_email: string;
  credits: number;
  amount: number;
  date: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  toEmail: string;
  actionRoute: string;
  time: string;
  read: boolean;
}

export interface UserManageItem {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  role: UserRole;
  credits: number;
}

export interface CampaignReport {
  id: string;
  campaign_id: string;
  campaign_title: string;
  reporter_name: string;
  reporter_email: string;
  reason: string;
  date: string;
}

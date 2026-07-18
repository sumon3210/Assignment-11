import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Use higher limits for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_PATH = path.join(process.cwd(), "db.json");

// Helper types
interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  passwordHash: string; // Stored in plain or hashed for simple register/login
  role: "Supporter" | "Creator" | "Admin";
  credits: number;
}

interface Campaign {
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

interface Contribution {
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

interface Withdrawal {
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

interface Payment {
  id: string;
  supporter_email: string;
  credits: number;
  amount: number;
  date: string;
}

interface Report {
  id: string;
  campaign_id: string;
  campaign_title: string;
  reporter_name: string;
  reporter_email: string;
  reason: string;
  date: string;
}

interface Notification {
  id: string;
  message: string;
  toEmail: string;
  actionRoute: string;
  time: string;
  read: boolean;
}

interface TokenStore {
  [token: string]: string; // token -> email
}

interface Database {
  users: User[];
  campaigns: Campaign[];
  contributions: Contribution[];
  withdrawals: Withdrawal[];
  payments: Payment[];
  reports: Report[];
  notifications: Notification[];
  tokens: TokenStore;
}

// Initialize database with premium default seed data for a professional look out-of-the-box!
const INITIAL_DATABASE: Database = {
  users: [
    {
      id: "u1",
      name: "Admin User",
      email: "admin@gmail.com",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      passwordHash: "admin123",
      role: "Admin",
      credits: 1000
    },
    {
      id: "u2",
      name: "Alex Creator",
      email: "creator@gmail.com",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      passwordHash: "creator123",
      role: "Creator",
      credits: 200
    },
    {
      id: "u3",
      name: "Sarah Supporter",
      email: "supporter@gmail.com",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      passwordHash: "supporter123",
      role: "Supporter",
      credits: 500
    }
  ],
  campaigns: [
    {
      id: "c1",
      title: "Solar-Powered Water Pump for Rural Farms",
      story: "We are developing an open-source, affordable solar-powered water pump designed for smallholder farmers in off-grid communities. This pump can draw water from up to 30 meters depth and runs entirely on renewable solar power, eliminating fuel costs and lowering carbon emissions.",
      category: "Technology",
      funding_goal: 5000,
      minimum_contribution: 20,
      deadline: "2026-11-15",
      reward_info: "Early Access blueprint + Solar sticker pack for pledges over 50 credits.",
      campaign_image_url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      status: "approved",
      amount_raised: 4200
    },
    {
      id: "c2",
      title: "Ocean Plastic Sunglasses & Tech Accessories",
      story: "Every year, millions of tons of plastic enter our oceans. We collect this plastic and recycle it into durable, high-fashion sunglasses and workspace accessories. Every purchase funds ocean clean-ups.",
      category: "Community",
      funding_goal: 3000,
      minimum_contribution: 15,
      deadline: "2026-12-05",
      reward_info: "One pair of Recycled Ocean Blue Sunglasses for contributions of 150+ credits.",
      campaign_image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      status: "approved",
      amount_raised: 2800
    },
    {
      id: "c3",
      title: "Green Community Botanical Hub & Greenhouse",
      story: "Help us establish a collaborative urban greenhouse. This hub will provide free gardening workshops, distribute organic vegetable seedlings, and build a local sanctuary for bees and butterflies in the middle of our concrete jungle.",
      category: "Art",
      funding_goal: 1500,
      minimum_contribution: 10,
      deadline: "2026-10-10",
      reward_info: "Your name engraved on the Founder's Brick + a jar of pure community honey.",
      campaign_image_url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      status: "approved",
      amount_raised: 1200
    },
    {
      id: "c4",
      title: "Robotic STEAM Kits for Underfunded Schools",
      story: "Our mission is to make science, technology, engineering, art, and math (STEAM) accessible to every student. We have developed a modular, low-cost robotics kit. Funding will cover manufacturing costs to ship 500 free kits to rural classrooms.",
      category: "Technology",
      funding_goal: 8000,
      minimum_contribution: 25,
      deadline: "2026-12-25",
      reward_info: "Live digital coding session with the engineering team + modular kit.",
      campaign_image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      status: "approved",
      amount_raised: 5600
    },
    {
      id: "c5",
      title: "Clean Water Well Drilling in Arid Regions",
      story: "We are raising funds to drill three deep-water borewells in arid rural villages. This will provide consistent, clean, and safe drinking water to over 1,200 villagers, cutting down daily water retrieval walking distances by miles.",
      category: "Health",
      funding_goal: 4000,
      minimum_contribution: 10,
      deadline: "2026-09-30",
      reward_info: "Personalized video update from the site on the day the well starts flowing.",
      campaign_image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1w07D3AC7WDsB72YPnTmOjq-obhujl2dmxSAxrEYBrQ&s=10",
      creator_name: "Emma Watson",
      creator_email: "emma@gmail.com",
      status: "approved",
      amount_raised: 3800
    },
    {
      id: "c6",
      title: "Modular Vertical Farming System for Apartments",
      story: "Bring the farm into your kitchen. We have designed a smart, self-watering, and energy-efficient vertical planter that lets anyone grow fresh salads, microgreens, and strawberries indoors with zero effort.",
      category: "Technology",
      funding_goal: 6000,
      minimum_contribution: 30,
      deadline: "2026-12-01",
      reward_info: "Complete Indoor Herb Starter Kit with non-GMO organic seeds.",
      campaign_image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
      creator_name: "Emma Watson",
      creator_email: "emma@gmail.com",
      status: "approved",
      amount_raised: 1500
    },
    {
      id: "c7",
      title: "Eco-Friendly Portable Air Purifier",
      story: "An air purifier constructed entirely from bio-plastics and utilizing zero-waste natural filters made of coconut fiber. Compact, rechargeable, and highly effective against pollen, dust, and VOCs.",
      category: "Technology",
      funding_goal: 2000,
      minimum_contribution: 20,
      deadline: "2026-10-30",
      reward_info: "Super Early Bird custom engraved air purifier unit.",
      campaign_image_url: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      status: "pending",
      amount_raised: 0
    }
  ],
  contributions: [
    {
      id: "con1",
      campaign_id: "c1",
      campaign_title: "Solar-Powered Water Pump for Rural Farms",
      contribution_amount: 150,
      supporter_email: "supporter@gmail.com",
      supporter_name: "Sarah Supporter",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      current_date: "2026-07-10",
      status: "approved"
    },
    {
      id: "con2",
      campaign_id: "c2",
      campaign_title: "Ocean Plastic Sunglasses & Tech Accessories",
      contribution_amount: 50,
      supporter_email: "supporter@gmail.com",
      supporter_name: "Sarah Supporter",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      current_date: "2026-07-12",
      status: "approved"
    },
    {
      id: "con3",
      campaign_id: "c1",
      campaign_title: "Solar-Powered Water Pump for Rural Farms",
      contribution_amount: 80,
      supporter_email: "supporter@gmail.com",
      supporter_name: "Sarah Supporter",
      creator_name: "Alex Creator",
      creator_email: "creator@gmail.com",
      current_date: "2026-07-14",
      status: "pending"
    }
  ],
  withdrawals: [
    {
      id: "w1",
      creator_email: "creator@gmail.com",
      creator_name: "Alex Creator",
      withdrawal_credit: 300,
      withdrawal_amount: 15,
      payment_system: "Stripe",
      account_number: "acct_12345",
      withdraw_date: "2026-07-05",
      status: "approved"
    }
  ],
  payments: [
    {
      id: "p1",
      supporter_email: "supporter@gmail.com",
      credits: 800,
      amount: 60,
      date: "2026-07-01"
    }
  ],
  reports: [
    {
      id: "r1",
      campaign_id: "c6",
      campaign_title: "Modular Vertical Farming System for Apartments",
      reporter_name: "Sarah Supporter",
      reporter_email: "supporter@gmail.com",
      reason: "Campaign description is identical to a commercial retail project on another site.",
      date: "2026-07-13"
    }
  ],
  notifications: [
    {
      id: "n1",
      message: "Your Contribution of 150 credits to Solar-Powered Water Pump for Rural Farms was approved by Alex Creator",
      toEmail: "supporter@gmail.com",
      actionRoute: "/dashboard",
      time: "2026-07-10T14:30:00Z",
      read: false
    }
  ],
  tokens: {}
};

// Database Read/Write helpers
function readDB(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATABASE, null, 2), "utf8");
      return INITIAL_DATABASE;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file, returning default", err);
    return INITIAL_DATABASE;
  }
}

function writeDB(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Check and seed if file doesn't exist
readDB();

// Authentication middleware
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }
  const token = authHeader.split(" ")[1];
  const db = readDB();
  const email = db.tokens[token];
  if (!email) {
    return res.status(401).json({ error: "Access denied. Invalid session token." });
  }
  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Access denied. User not found." });
  }
  (req as any).user = user;
  next();
}

// Role Check Helpers
function requireRole(roles: Array<"Supporter" | "Creator" | "Admin">) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as User;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: `Access forbidden. Required role(s): ${roles.join(", ")}` });
    }
    next();
  };
}

// Helpers to push notifications
function addNotification(message: string, toEmail: string, actionRoute: string, db: Database) {
  const newNotif: Notification = {
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    message,
    toEmail,
    actionRoute,
    time: new Date().toISOString(),
    read: false
  };
  db.notifications.push(newNotif);
}

// API Routes

// Registration
app.post("/api/auth/register", (req, res) => {
  const { name, email, photoUrl, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All input fields are required." });
  }

  // Basic email structure validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists." });
  }

  // Credit calculation: Supporter gets 50, Creator gets 20, Admin gets 1000
  let credits = 0;
  if (role === "Supporter") credits = 50;
  else if (role === "Creator") credits = 20;
  else if (role === "Admin") credits = 1000;

  const newUser: User = {
    id: "u_" + Date.now(),
    name,
    email: email.toLowerCase(),
    photoUrl: photoUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
    passwordHash: password, // simple storage as requested
    role,
    credits
  };

  db.users.push(newUser);

  // Auto login upon registration
  const token = "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  db.tokens[token] = newUser.email;

  writeDB(db);

  return res.json({
    message: "Registration successful!",
    token,
    user: {
      name: newUser.name,
      email: newUser.email,
      photoUrl: newUser.photoUrl,
      role: newUser.role,
      credits: newUser.credits
    }
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== password) {
    return res.status(400).json({ error: "Incorrect email or password." });
  }

  // Generate Access Token
  const token = "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  db.tokens[token] = user.email;

  writeDB(db);

  return res.json({
    message: "Login successful!",
    token,
    user: {
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      role: user.role,
      credits: user.credits
    }
  });
});

// Google Sign-In Quick Sim
app.post("/api/auth/google-signin", (req, res) => {
  const { name, email, photoUrl } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required for Google Sign-In" });
  }

  const db = readDB();
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Register as Supporter by default with 50 credits
    user = {
      id: "u_" + Date.now(),
      name: name || "Google User",
      email: email.toLowerCase(),
      photoUrl: photoUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(email)}`,
      passwordHash: "google_oauth_bypass",
      role: "Supporter",
      credits: 50
    };
    db.users.push(user);
  }

  const token = "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  db.tokens[token] = user.email;

  writeDB(db);

  return res.json({
    message: "Google login successful!",
    token,
    user: {
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      role: user.role,
      credits: user.credits
    }
  });
});

// Get Me
app.get("/api/auth/me", authenticate, (req, res) => {
  const user = (req as any).user as User;
  return res.json({
    user: {
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      role: user.role,
      credits: user.credits
    }
  });
});

// GET Explore Campaigns (Approved, active)
app.get("/api/campaigns", (req, res) => {
  const db = readDB();
  // Filter approved and not expired
  const activeCampaigns = db.campaigns.filter(c => c.status === "approved");
  return res.json(activeCampaigns);
});

// GET Top Funded Campaigns (Approved, limit 6 sorted by raised)
app.get("/api/campaigns/top-funded", (req, res) => {
  const db = readDB();
  const approved = db.campaigns.filter(c => c.status === "approved");
  const top6 = approved
    .sort((a, b) => b.amount_raised - a.amount_raised)
    .slice(0, 6);
  return res.json(top6);
});

// GET Campaign Details
app.get("/api/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found." });
  }
  return res.json(campaign);
});

// POST Create Campaign (Creator only)
app.post("/api/campaigns", authenticate, requireRole(["Creator"]), (req, res) => {
  const { title, story, category, funding_goal, minimum_contribution, deadline, reward_info, campaign_image_url } = req.body;
  const user = (req as any).user as User;

  if (!title || !story || !category || !funding_goal || !minimum_contribution || !deadline || !reward_info) {
    return res.status(400).json({ error: "All campaign fields are required." });
  }

  const db = readDB();
  const newCampaign: Campaign = {
    id: "c_" + Date.now(),
    title,
    story,
    category,
    funding_goal: Number(funding_goal),
    minimum_contribution: Number(minimum_contribution),
    deadline,
    reward_info,
    campaign_image_url: campaign_image_url || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    creator_name: user.name,
    creator_email: user.email,
    status: "pending", // Pending admin approval
    amount_raised: 0
  };

  db.campaigns.push(newCampaign);

  // Notify admins (optional helper) or log
  addNotification(
    `New campaign '${title}' launched by ${user.name} is pending your approval.`,
    "admin@gmail.com",
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: "Campaign successfully submitted for review!",
    campaign: newCampaign
  });
});

// GET Creator's own campaigns (Creator only)
app.get("/api/creator/campaigns", authenticate, requireRole(["Creator"]), (req, res) => {
  const user = (req as any).user as User;
  const db = readDB();
  const myCampaigns = db.campaigns
    .filter(c => c.creator_email === user.email)
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()); // descending deadline
  return res.json(myCampaigns);
});

// PUT Update Campaign (Creator only)
app.put("/api/campaigns/:id", authenticate, requireRole(["Creator"]), (req, res) => {
  const { id } = req.params;
  const { title, story, reward_info } = req.body;
  const user = (req as any).user as User;

  if (!title || !story || !reward_info) {
    return res.status(400).json({ error: "Title, Story and Reward Info are required for update." });
  }

  const db = readDB();
  const campaignIdx = db.campaigns.findIndex(c => c.id === id && c.creator_email === user.email);
  if (campaignIdx === -1) {
    return res.status(404).json({ error: "Campaign not found or unauthorized." });
  }

  db.campaigns[campaignIdx].title = title;
  db.campaigns[campaignIdx].story = story;
  db.campaigns[campaignIdx].reward_info = reward_info;

  writeDB(db);

  return res.json({
    message: "Campaign updated successfully!",
    campaign: db.campaigns[campaignIdx]
  });
});

// DELETE Campaign (Creator only - deletes and refunds all approved contributions)
app.delete("/api/campaigns/:id", authenticate, requireRole(["Creator"]), (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === id && c.creator_email === user.email);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found or unauthorized." });
  }

  // Find all approved contributions for this campaign to refund them
  const relatedContributions = db.contributions.filter(con => con.campaign_id === id);
  
  relatedContributions.forEach(con => {
    if (con.status === "approved") {
      const supporter = db.users.find(u => u.email === con.supporter_email);
      if (supporter) {
        supporter.credits += con.contribution_amount;
        // Notify supporter
        addNotification(
          `The campaign '${campaign.title}' was deleted by the creator. Your contribution of ${con.contribution_amount} credits has been refunded.`,
          supporter.email,
          "/dashboard",
          db
        );
      }
    }
    // Delete/Mark contribution
    con.status = "rejected";
  });

  // Filter out the campaign
  db.campaigns = db.campaigns.filter(c => c.id !== id);

  writeDB(db);

  return res.json({
    message: "Campaign deleted and all approved supporters have been refunded successfully."
  });
});

// POST Report Campaign (Supporter only)
app.post("/api/campaigns/:id/report", authenticate, requireRole(["Supporter"]), (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = (req as any).user as User;

  if (!reason) {
    return res.status(400).json({ error: "Reason for reporting is required." });
  }

  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found." });
  }

  const newReport: Report = {
    id: "rep_" + Date.now(),
    campaign_id: id,
    campaign_title: campaign.title,
    reporter_name: user.name,
    reporter_email: user.email,
    reason,
    date: new Date().toISOString().split("T")[0]
  };

  db.reports.push(newReport);
  writeDB(db);

  return res.json({
    message: "Campaign reported successfully. The administration will investigate.",
    report: newReport
  });
});

// GET Supporter Stats & Approved Contributions
app.get("/api/supporter/dashboard", authenticate, requireRole(["Supporter"]), (req, res) => {
  const user = (req as any).user as User;
  const db = readDB();

  const userContributions = db.contributions.filter(c => c.supporter_email === user.email);
  const totalContributionsCount = userContributions.length;
  const pendingContributionsCount = userContributions.filter(c => c.status === "pending").length;
  
  const totalAmountContributed = userContributions
    .filter(c => c.status === "approved")
    .reduce((sum, c) => sum + c.contribution_amount, 0);

  const approvedContributions = userContributions.filter(c => c.status === "approved");

  return res.json({
    stats: {
      totalContributions: totalContributionsCount,
      totalPending: pendingContributionsCount,
      totalAmountContributed
    },
    approvedContributions
  });
});

// GET Supporter My Contributions with PAGINATION
app.get("/api/supporter/contributions", authenticate, requireRole(["Supporter"]), (req, res) => {
  const user = (req as any).user as User;
  const db = readDB();
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  const userContributions = db.contributions
    .filter(c => c.supporter_email === user.email)
    .sort((a, b) => new Date(b.current_date).getTime() - new Date(a.current_date).getTime());

  const total = userContributions.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedItems = userContributions.slice(startIndex, endIndex);

  return res.json({
    contributions: paginatedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// POST Create Contribution (Supporter only)
app.post("/api/contributions", authenticate, requireRole(["Supporter"]), (req, res) => {
  const { campaign_id, contribution_amount } = req.body;
  const user = (req as any).user as User;

  if (!campaign_id || !contribution_amount || Number(contribution_amount) <= 0) {
    return res.status(400).json({ error: "Valid contribution amount is required." });
  }

  const amount = Number(contribution_amount);
  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === campaign_id);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found." });
  }

  if (amount < campaign.minimum_contribution) {
    return res.status(400).json({ error: `Minimum contribution for this campaign is ${campaign.minimum_contribution} credits.` });
  }

  // Fetch the latest state of the Supporter
  const supporterUser = db.users.find(u => u.email === user.email);
  if (!supporterUser) {
    return res.status(404).json({ error: "Supporter user profile not found." });
  }

  if (supporterUser.credits < amount) {
    return res.status(400).json({ error: "Insufficient available credits. Please purchase more credits first." });
  }

  // Deduct credits immediately on contribution submission
  supporterUser.credits -= amount;

  const newContribution: Contribution = {
    id: "con_" + Date.now(),
    campaign_id,
    campaign_title: campaign.title,
    contribution_amount: amount,
    supporter_email: supporterUser.email,
    supporter_name: supporterUser.name,
    creator_name: campaign.creator_name,
    creator_email: campaign.creator_email,
    current_date: new Date().toISOString().split("T")[0],
    status: "pending"
  };

  db.contributions.push(newContribution);

  // Notify creator
  addNotification(
    `New Contribution of ${amount} credits to your campaign '${campaign.title}' from ${supporterUser.name}.`,
    campaign.creator_email,
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: "Contribution submitted successfully! Pending creator approval.",
    contribution: newContribution,
    remainingCredits: supporterUser.credits
  });
});

// Creator Stats and pending reviews
app.get("/api/creator/dashboard", authenticate, requireRole(["Creator"]), (req, res) => {
  const user = (req as any).user as User;
  const db = readDB();

  const myCampaigns = db.campaigns.filter(c => c.creator_email === user.email);
  const totalCampaigns = myCampaigns.length;
  
  const activeCampaigns = myCampaigns.filter(c => {
    const isExpired = new Date(c.deadline).getTime() < Date.now();
    return !isExpired && c.status === "approved";
  }).length;

  const totalAmountRaised = myCampaigns
    .filter(c => c.status === "approved")
    .reduce((sum, c) => sum + c.amount_raised, 0);

  // Contributions pending review for campaigns owned by this creator
  const pendingContributions = db.contributions.filter(
    con => con.creator_email === user.email && con.status === "pending"
  );

  return res.json({
    stats: {
      totalCampaigns,
      activeCampaigns,
      totalAmountRaised
    },
    pendingContributions
  });
});

// Creator Approve Contribution
app.post("/api/contributions/:id/approve", authenticate, requireRole(["Creator"]), (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const db = readDB();
  const contribution = db.contributions.find(c => c.id === id && c.creator_email === user.email);
  if (!contribution) {
    return res.status(404).json({ error: "Contribution request not found or unauthorized." });
  }

  if (contribution.status !== "pending") {
    return res.status(400).json({ error: `Contribution is already ${contribution.status}.` });
  }

  // Find corresponding campaign
  const campaign = db.campaigns.find(c => c.id === contribution.campaign_id);
  if (!campaign) {
    return res.status(404).json({ error: "Associated campaign not found." });
  }

  // Update contribution status
  contribution.status = "approved";
  // Add contribution credits to campaign raised
  campaign.amount_raised += contribution.contribution_amount;

  // Notify supporter
  addNotification(
    `Your Contribution of ${contribution.contribution_amount} credits to '${campaign.title}' was approved by ${user.name}.`,
    contribution.supporter_email,
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: "Contribution approved successfully!",
    contribution
  });
});

// Creator Reject Contribution (Refunds credits back to Supporter)
app.post("/api/contributions/:id/reject", authenticate, requireRole(["Creator"]), (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const db = readDB();
  const contribution = db.contributions.find(c => c.id === id && c.creator_email === user.email);
  if (!contribution) {
    return res.status(404).json({ error: "Contribution request not found or unauthorized." });
  }

  if (contribution.status !== "pending") {
    return res.status(400).json({ error: `Contribution is already ${contribution.status}.` });
  }

  // Find corresponding supporter to refund
  const supporter = db.users.find(u => u.email === contribution.supporter_email);
  if (!supporter) {
    return res.status(404).json({ error: "Supporter who made the contribution could not be found." });
  }

  // Update contribution status
  contribution.status = "rejected";
  
  // Refund credits back
  supporter.credits += contribution.contribution_amount;

  // Notify supporter
  addNotification(
    `Your Contribution of ${contribution.contribution_amount} credits to '${contribution.campaign_title}' was rejected by ${user.name} and refunded back to your account.`,
    contribution.supporter_email,
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: "Contribution rejected and credits refunded to supporter.",
    contribution
  });
});

// Creator Withdraw request
// 20 credits = 1 Dollar
// Min 200 credits to withdraw ($10)
app.post("/api/creator/withdraw", authenticate, requireRole(["Creator"]), (req, res) => {
  const { credits, paymentSystem, accountNumber } = req.body;
  const user = (req as any).user as User;

  if (!credits || Number(credits) < 200 || !paymentSystem || !accountNumber) {
    return res.status(400).json({ error: "Minimum withdrawal is 200 credits ($10). All fields are required." });
  }

  const withdrawCredits = Number(credits);
  const withdrawAmountDollars = withdrawCredits / 20;

  const db = readDB();

  // Find creator's actual campaign funds raised vs already withdrawn / pending to see if they have enough balance
  // Business Logic: Let's fetch how many credits they raised in their approved campaigns
  const myCampaigns = db.campaigns.filter(c => c.creator_email === user.email && c.status === "approved");
  const totalCreditsRaised = myCampaigns.reduce((sum, c) => sum + c.amount_raised, 0);

  // Subtract already approved or pending withdrawals
  const myWithdrawals = db.withdrawals.filter(w => w.creator_email === user.email);
  const totalWithdrawnCredits = myWithdrawals.reduce((sum, w) => sum + w.withdrawal_credit, 0);

  const availableToWithdraw = totalCreditsRaised - totalWithdrawnCredits;

  if (withdrawCredits > availableToWithdraw) {
    return res.status(400).json({ error: `Insufficient credit. You have ${availableToWithdraw} credits available to withdraw.` });
  }

  const newWithdrawal: Withdrawal = {
    id: "w_" + Date.now(),
    creator_email: user.email,
    creator_name: user.name,
    withdrawal_credit: withdrawCredits,
    withdrawal_amount: withdrawAmountDollars,
    payment_system: paymentSystem,
    account_number: accountNumber,
    withdraw_date: new Date().toISOString().split("T")[0],
    status: "pending"
  };

  db.withdrawals.push(newWithdrawal);

  // Create admin notification
  addNotification(
    `Creator ${user.name} requested withdrawal of ${withdrawCredits} credits ($${withdrawAmountDollars}).`,
    "admin@gmail.com",
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: "Withdrawal request submitted successfully!",
    withdrawal: newWithdrawal
  });
});

// Creator GET Withdrawal History
app.get("/api/creator/withdrawals", authenticate, requireRole(["Creator"]), (req, res) => {
  const user = (req as any).user as User;
  const db = readDB();
  const myWithdrawals = db.withdrawals
    .filter(w => w.creator_email === user.email)
    .sort((a, b) => new Date(b.withdraw_date).getTime() - new Date(a.withdraw_date).getTime());
  
  // Calculate earnings
  const myCampaigns = db.campaigns.filter(c => c.creator_email === user.email && c.status === "approved");
  const currentRaisedCredits = myCampaigns.reduce((sum, c) => sum + c.amount_raised, 0);
  
  const approvedWithdrawn = myWithdrawals
    .filter(w => w.status === "approved")
    .reduce((sum, w) => sum + w.withdrawal_credit, 0);

  const pendingWithdrawn = myWithdrawals
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + w.withdrawal_credit, 0);

  return res.json({
    withdrawals: myWithdrawals,
    earnings: {
      totalRaisedCredits: currentRaisedCredits,
      availableCredits: currentRaisedCredits - (approvedWithdrawn + pendingWithdrawn),
      withdrawnDollars: approvedWithdrawn / 20
    }
  });
});

// Supporter Buy Credits (Stripe Simulation)
app.post("/api/supporter/purchase", authenticate, requireRole(["Supporter"]), (req, res) => {
  const { credits, amount, paymentMethodId } = req.body;
  const user = (req as any).user as User;

  if (!credits || !amount) {
    return res.status(400).json({ error: "Invalid credit package selected." });
  }

  const db = readDB();
  const supporterUser = db.users.find(u => u.email === user.email);
  if (!supporterUser) {
    return res.status(404).json({ error: "Supporter profile not found." });
  }

  // Credit purchasing formula confirmation
  const addedCredits = Number(credits);
  supporterUser.credits += addedCredits;

  const newPayment: Payment = {
    id: "pay_" + Date.now(),
    supporter_email: supporterUser.email,
    credits: addedCredits,
    amount: Number(amount),
    date: new Date().toISOString().split("T")[0]
  };

  db.payments.push(newPayment);

  // Push notification
  addNotification(
    `Success! Your payment of $${amount} for ${addedCredits} credits was processed successfully.`,
    supporterUser.email,
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: `Successfully purchased ${addedCredits} credits!`,
    credits: supporterUser.credits,
    payment: newPayment
  });
});

// GET Supporter Payment History
app.get("/api/supporter/payments", authenticate, requireRole(["Supporter"]), (req, res) => {
  const user = (req as any).user as User;
  const db = readDB();
  const payments = db.payments
    .filter(p => p.supporter_email === user.email)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return res.json(payments);
});


// ADMIN ROUTES

// GET Admin Dashboard Stats
app.get("/api/admin/dashboard", authenticate, requireRole(["Admin"]), (req, res) => {
  const db = readDB();

  const totalSupporters = db.users.filter(u => u.role === "Supporter").length;
  const totalCreators = db.users.filter(u => u.role === "Creator").length;
  const totalAvailableCredits = db.users.reduce((sum, u) => sum + u.credits, 0);
  
  // Total payments processed is withdrawals approved
  const totalPaymentsProcessed = db.withdrawals
    .filter(w => w.status === "approved")
    .reduce((sum, w) => sum + w.withdrawal_amount, 0);

  return res.json({
    stats: {
      totalSupporters,
      totalCreators,
      totalAvailableCredits,
      totalPaymentsProcessed
    }
  });
});

// GET Pending Campaigns
app.get("/api/admin/campaigns/pending", authenticate, requireRole(["Admin"]), (req, res) => {
  const db = readDB();
  const pending = db.campaigns.filter(c => c.status === "pending");
  return res.json(pending);
});

// POST Approve/Reject Campaign
app.post("/api/admin/campaigns/:id/status", authenticate, requireRole(["Admin"]), (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status update request." });
  }

  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found." });
  }

  campaign.status = status;

  // Notify Creator
  addNotification(
    `Your campaign '${campaign.title}' was ${status} by the Admin.`,
    campaign.creator_email,
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: `Campaign successfully ${status}!`,
    campaign
  });
});

// GET Pending Withdrawals
app.get("/api/admin/withdrawals/pending", authenticate, requireRole(["Admin"]), (req, res) => {
  const db = readDB();
  const pending = db.withdrawals.filter(w => w.status === "pending");
  return res.json(pending);
});

// POST Approve Withdrawal request (Payment Success)
app.post("/api/admin/withdrawals/:id/approve", authenticate, requireRole(["Admin"]), (req, res) => {
  const { id } = req.params;

  const db = readDB();
  const withdrawal = db.withdrawals.find(w => w.id === id);
  if (!withdrawal) {
    return res.status(404).json({ error: "Withdrawal request not found." });
  }

  if (withdrawal.status !== "pending") {
    return res.status(400).json({ error: "Withdrawal is already processed." });
  }

  withdrawal.status = "approved";

  // Deduct the Creator's raised campaign credits or creator's individual profile credits
  // According to description: "Decrease the creator's raised credits by the withdrawal amount."
  // Creators raised funds are tracked in their campaigns.
  // We can subtract this from the creator's personal balance, and also mark this withdrawal as processed.
  const creator = db.users.find(u => u.email === withdrawal.creator_email);
  if (creator) {
    // If we want to decrease creator's available credits too
    creator.credits = Math.max(0, creator.credits - withdrawal.withdrawal_credit);
  }

  // Notify creator
  addNotification(
    `Your withdrawal request of ${withdrawal.withdrawal_credit} credits ($${withdrawal.withdrawal_amount}) was approved by Admin.`,
    withdrawal.creator_email,
    "/dashboard",
    db
  );

  writeDB(db);

  return res.json({
    message: "Withdrawal request approved successfully!",
    withdrawal
  });
});

// GET Manage Users (All users)
app.get("/api/admin/users", authenticate, requireRole(["Admin"]), (req, res) => {
  const db = readDB();
  const filteredUsers = db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    photoUrl: u.photoUrl,
    role: u.role,
    credits: u.credits
  }));
  return res.json(filteredUsers);
});

// POST Update User Role
app.post("/api/admin/users/:email/role", authenticate, requireRole(["Admin"]), (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  if (!["Admin", "Creator", "Supporter"].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  user.role = role;
  writeDB(db);

  return res.json({
    message: `User role for ${email} updated to ${role} successfully.`,
    user: {
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// DELETE Remove User
app.delete("/api/admin/users/:email", authenticate, requireRole(["Admin"]), (req, res) => {
  const { email } = req.params;

  const db = readDB();
  const originalCount = db.users.length;
  db.users = db.users.filter(u => u.email.toLowerCase() !== email.toLowerCase());

  if (db.users.length === originalCount) {
    return res.status(404).json({ error: "User not found." });
  }

  // Remove active tokens for deleted user
  Object.keys(db.tokens).forEach(tok => {
    if (db.tokens[tok] === email) {
      delete db.tokens[tok];
    }
  });

  writeDB(db);

  return res.json({
    message: `User ${email} removed successfully from the platform.`
  });
});

// GET Manage Campaigns
app.get("/api/admin/campaigns", authenticate, requireRole(["Admin"]), (req, res) => {
  const db = readDB();
  return res.json(db.campaigns);
});

// DELETE Campaign (Admin side)
app.delete("/api/admin/campaigns/:id", authenticate, requireRole(["Admin"]), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found." });
  }

  // Refund all approved contributions for this campaign back to the supporters
  const contributionsToRefund = db.contributions.filter(c => c.campaign_id === id && c.status === "approved");
  contributionsToRefund.forEach(con => {
    const supporter = db.users.find(u => u.email === con.supporter_email);
    if (supporter) {
      supporter.credits += con.contribution_amount;
      addNotification(
        `The campaign '${campaign.title}' was deleted by the administrator. Your contribution of ${con.contribution_amount} credits has been fully refunded.`,
        supporter.email,
        "/dashboard",
        db
      );
    }
  });

  // Mark all contributions as rejected/refunded
  db.contributions.forEach(con => {
    if (con.campaign_id === id) {
      con.status = "rejected";
    }
  });

  // Remove the campaign
  db.campaigns = db.campaigns.filter(c => c.id !== id);
  // Remove any associated reports
  db.reports = db.reports.filter(r => r.campaign_id !== id);

  writeDB(db);

  return res.json({
    message: "Campaign deleted by Administrator. All approved contributors have been fully refunded."
  });
});

// GET Admin Reports
app.get("/api/admin/reports", authenticate, requireRole(["Admin"]), (req, res) => {
  const db = readDB();
  return res.json(db.reports);
});

// GET User Notifications
app.get("/api/notifications", authenticate, (req, res) => {
  const user = (req as any).user as User;
  const db = readDB();
  const userNotifs = db.notifications
    .filter(n => n.toEmail.toLowerCase() === user.email.toLowerCase())
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()); // descending time
  return res.json(userNotifs);
});

// POST Mark Notification Read
app.post("/api/notifications/:id/read", authenticate, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const db = readDB();
  const notif = db.notifications.find(n => n.id === id && n.toEmail.toLowerCase() === user.email.toLowerCase());
  if (notif) {
    notif.read = true;
    writeDB(db);
  }
  return res.json({ status: "success" });
});

// POST Base64 image upload simulator (Very secure, stays in db, extremely portable!)
app.post("/api/upload", (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }
  // To keep it clean and robust, we can return the exact base64 data URI so it is fully self-contained!
  // This satisfies imgBB style "upload returns a hotlink" but completely locally and with zero key configurations!
  return res.json({
    url: imageBase64
  });
});

// Vite full-stack middleware setups
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

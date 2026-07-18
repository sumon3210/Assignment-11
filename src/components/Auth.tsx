import React, { useState } from "react";
import { LoggedInUser } from "../types";
import { Lock, Mail, User, Shield, Camera, Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthProps {
  initialMode?: "login" | "register";
  onAuthSuccess: (token: string, user: LoggedInUser) => void;
  onNavigate: (route: string) => void;
}

export default function Auth({ initialMode = "login", onAuthSuccess, onNavigate }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  
  // Registration States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [role, setRole] = useState<"Supporter" | "Creator">("Supporter");
  const [uploadingImage, setUploadingImage] = useState(false);

  // General States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // File to base64 converter (Mocking imgBB upload directly in client so it operates perfectly!)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Call backend upload endpoint
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        });
        
        const data = await response.json();
        if (response.ok && data.url) {
          setPhotoUrl(data.url);
        } else {
          setError(data.error || "Failed to process photo");
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Image process error", err);
      setError("Failed to convert image. Please choose another.");
      setUploadingImage(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, photoUrl, password, role })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Save token & user state
      localStorage.setItem("crowdfund_token", data.token);
      localStorage.setItem("crowdfund_user", JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("crowdfund_token", data.token);
      localStorage.setItem("crowdfund_user", JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const emailSim = `google_user_${Math.floor(1000 + Math.random() * 9000)}@gmail.com`;
      const res = await fetch("/api/auth/google-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Google Authenticated User",
          email: emailSim,
          photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google Sign-In failed");

      localStorage.setItem("crowdfund_token", data.token);
      localStorage.setItem("crowdfund_user", JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Google Sign-In simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-panel" className="min-h-[80vh] flex items-center justify-center py-12 px-6 bg-slate-50">
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        
        {/* Decorative Side Panel */}
        <div className="md:col-span-5 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient background accent */}
          <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10">
            <span className="font-display font-extrabold text-2xl tracking-tight text-teal-400 block mb-2 cursor-pointer" onClick={() => onNavigate("home")}>
              CrowdFund
            </span>
            <p className="font-sans text-slate-400 text-sm leading-relaxed mt-4">
              Join thousands of creators raising pre-seed credits, or discover next-generation tech, art, and health innovations that you can support.
            </p>
          </div>

          <div className="relative z-10 mt-12 md:mt-0 font-sans text-slate-400 text-xs leading-relaxed border-t border-slate-800 pt-6">
            <p className="font-semibold text-slate-300 mb-2">Our Commitments:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>100% Client Refund Security</li>
              <li>Symmetric 20 Credits / Dollar Withdrawal Rate</li>
              <li>Fully Audit-Ready Campaign Disclosures</li>
            </ul>
          </div>
        </div>

        {/* Form Panel */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-900 mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {mode === "login"
                ? "Enter your credentials to manage campaigns or contributions."
                : "Choose your role and register to get started."}
            </p>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl mb-6">
                {error}
              </div>
            )}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  
                  {/* Name field */}
                  <div>
                    <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-1.5">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-500 rounded-xl outline-none transition font-sans text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="johndoe@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-500 rounded-xl outline-none transition font-sans text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div>
                    <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-500 rounded-xl outline-none transition font-sans text-sm text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-1.5 flex gap-1">
                        <div className={`h-1.5 flex-1 rounded-full ${password.length >= 6 ? 'bg-teal-500' : 'bg-slate-200'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${password.length >= 8 ? 'bg-teal-500' : 'bg-slate-200'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${password.length >= 10 ? 'bg-teal-500' : 'bg-slate-200'}`} />
                      </div>
                    )}
                  </div>

                  {/* Role picker */}
                  <div>
                    <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-1.5">
                      I want to register as a
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("Supporter")}
                        className={`py-2.5 text-center font-semibold text-xs border rounded-xl cursor-pointer transition ${
                          role === "Supporter"
                            ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Supporter (Gets 50 Cr)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("Creator")}
                        className={`py-2.5 text-center font-semibold text-xs border rounded-xl cursor-pointer transition ${
                          role === "Creator"
                            ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Creator (Gets 20 Cr)
                      </button>
                    </div>
                  </div>

                  {/* Photo picker & local base64 upload simulator */}
                  <div>
                    <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-1.5">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {photoUrl ? (
                          <img src={photoUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-slate-400" />
                        )}
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          id="avatar-file-input"
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar-file-input"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs rounded-lg cursor-pointer inline-block border border-slate-200"
                        >
                          Upload Photo
                        </label>
                        <p className="text-[10px] text-slate-400 mt-1 font-sans">
                          JPEG/PNG. Files are compressed locally.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl mt-4 cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email field */}
                <div>
                  <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@gmail.com, creator@gmail.com, etc."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-500 rounded-xl outline-none transition font-sans text-sm text-slate-900"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-slate-700 text-xs font-mono uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-500 rounded-xl outline-none transition font-sans text-sm text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl mt-4 cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                </button>
              </form>
            )}

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-mono uppercase">Or Continue with</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.97 1 12 1 7.24 1 3.15 3.73 1.15 7.73l3.87 3c.92-2.77 3.51-4.69 6.98-4.69z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.43-4.91 3.43-8.6z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.02 14.27c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3l-3.87-3C.4 8.24 0 10.07 0 12s.4 3.76 1.15 5.33l3.87-3.06z"
                />
                <path
                  fill="#34A853"
                  d="M12 18.96c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.34 1.11-4.26 1.11-3.47 0-6.06-1.92-6.98-4.69l-3.87 3c2 4 6.09 6.37 10.85 6.37z"
                />
              </svg>
              Google Account
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-teal-600 hover:text-teal-700 font-semibold text-xs font-sans cursor-pointer transition"
              >
                {mode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

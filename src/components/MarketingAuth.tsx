import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { 
  Wifi, 
  Cpu, 
  ShieldCheck, 
  Radio, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  Check, 
  UserPlus, 
  Lock, 
  Mail, 
  Smartphone,
  RefreshCw
} from "lucide-react";

interface MarketingAuthProps {
  onAuthSuccess: (session: any) => void;
}

export default function MarketingAuth({ onAuthSuccess }: MarketingAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  // Validation/feedback status
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  // Live check username handle uniqueness
  useEffect(() => {
    if (isLogin || !username) {
      setUsernameAvailable(null);
      return;
    }

    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-zA-Z0-9_-]{3,15}$/.test(cleanUsername)) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const available = await api.profile.checkUsername(cleanUsername);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!email || !password) {
      setApiError("Email and Password are required credentials.");
      return;
    }

    if (!isLogin && !username) {
      setApiError("Please choose a custom public profile URL username.");
      return;
    }

    if (!isLogin && usernameAvailable === false) {
      setApiError("The username handle is already taken or is invalid.");
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        // Sign In
        const session = await api.auth.signIn(email, password);
        setApiSuccess("Access verified!");
        setTimeout(() => onAuthSuccess(session), 800);
      } else {
        // Sign Up
        const session = await api.auth.signUp(email, password, username, displayName);
        setApiSuccess("ChipNG activated! Profile handle reserved.");
        setTimeout(() => onAuthSuccess(session), 800);
      }
    } catch (err: any) {
      setApiError(err.message || "Credential authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setEmail("demo@chipng.co");
    setPassword("demo123");
    setIsLogin(true);
    setApiError("");
    
    // Auto-authenticate with seed demo
    try {
      setLoading(true);
      const session = await api.auth.signIn("demo@chipng.co", "demo123");
      setApiSuccess("Demo account accessed!");
      setTimeout(() => onAuthSuccess(session), 800);
    } catch (err: any) {
      setApiError("Error connecting to evaluation seed data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col md:flex-row relative">
      
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/5 to-rose-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Left Banner: Marketing Brand Story (VELMORA Inspired minimalism) */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative z-10 select-none">
        
        {/* Brand Top */}
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Wifi className="w-4.5 h-4.5 text-black stroke-[3px]" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-neutral-300">
            CHIPNG SYSTEM
          </span>
        </div>

        {/* Hero Copy */}
        <div className="my-12 md:my-0 space-y-6 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] uppercase font-bold font-mono tracking-widest text-amber-200">
              Introducing Contactless Bio Profile Cards
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] font-sans">
            Contactless <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              3D Business Cards
            </span><br />
            For Modern Innovators.
          </h1>

          <p className="text-xs text-neutral-400 leading-relaxed">
            ChipNG empowers founders, craft designers, and builders to host highly responsive public directory links paired with live interactive 3D metallic cards. Map our SaaS onto physical metal NFC tags instantly.
          </p>

          {/* Core high-end value props */}
          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                <strong className="text-white font-medium">3D Contactless Chip Render —</strong> Beautiful rotating, responsive 3D card layout projecting customized themes and contactless data.
              </p>
            </div>
            
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                <strong className="text-white font-medium">Any NTAG Custom Mapping —</strong> Program standard NFC hardware with simple, custom links. No proprietary readers required.
              </p>
            </div>
          </div>
        </div>

        {/* Trademark Footer */}
        <div className="text-[9px] font-mono uppercase text-neutral-500 tracking-wider">
          © 2026 CHIPNG GLOBAL SAAS. DESIGNED IN AMBER GOLD.
        </div>

      </div>

      {/* Right Side: Interactive premium authentication panel */}
      <div className="flex-1 p-6 md:p-16 flex items-center justify-center relative z-10 bg-black/50">
        
        <div className="w-full max-w-sm space-y-6">
          
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {isLogin ? "Welcome Back to ChipNG" : "Activate Your Username"}
            </h2>
            <p className="text-xs text-neutral-400 leading-snug">
              {isLogin 
                ? "Provide your authorized credentials to manage NFC profile pages." 
                : "Create a unique contactless bio workspace and select handles."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                {apiError}
              </div>
            )}
            
            {apiSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium">
                {apiSuccess}
              </div>
            )}

            {/* Display Name - Sign up only */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Display Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Victor Dennis"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#0d0d11] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Public Username handle - Sign up only */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex justify-between">
                  <span>Contact Profile Username handle</span>
                  {checkingUsername && <span className="text-[9px] text-amber-500 font-mono animate-pulse">Scanning...</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500 font-mono text-sm leading-relaxed">@</span>
                  <input
                    type="text"
                    placeholder="vickthor"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    className={`w-full bg-[#0d0d11] border rounded-xl pl-8 pr-12 py-2.5 text-sm text-white focus:outline-none font-mono ${
                      usernameAvailable === true 
                        ? "border-emerald-500/50" 
                        : usernameAvailable === false 
                          ? "border-rose-500/50" 
                          : "border-white/10"
                    }`}
                  />
                  <div className="absolute right-3 top-3 select-none">
                    {usernameAvailable === true ? (
                      <Check className="w-4.5 h-4.5 text-emerald-400" />
                    ) : usernameAvailable === false ? (
                      <span className="text-[8px] font-bold font-mono text-rose-400 uppercase">Clash</span>
                    ) : null}
                  </div>
                </div>
                <p className="text-[9px] text-neutral-500 font-mono leading-normal mt-1">
                  Public mapping will resolve at: <span className="text-neutral-300">chipng.co/{username || "username"}</span>
                </p>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Authorized Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="e.g. founder@mybrand.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d0d11] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Workspace Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0d0d11] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Submit Auth */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 disabled:opacity-60 text-sm font-bold text-black rounded-xl transition-all shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span>{isLogin ? "Authenticate Session" : "Create Card Workspace"}</span>
              )}
            </button>
          </form>

          {/* Toggle form context */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setApiError("");
                setApiSuccess("");
              }}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              {isLogin 
                ? "Need a contactless bio key? Open registration handle" 
                : "Already activated a profile tag? Session Authenticate"}
            </button>
          </div>

          {/* Direct Sandbox seed evaluation button */}
          <div className="border-t border-white/5 pt-4 space-y-2">
            <div className="text-center">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">
                Instant System Evaluation Check
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 rounded-lg flex items-center justify-center gap-2 border border-white/5 transition-all text-center"
            >
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span>Bypass & Instant Demo Sign-in</span>
            </button>
            <p className="text-[10px] text-neutral-500 text-center leading-normal">
              Click to bypass manual signup and review profile editing, theme layouts, 3D rotating cards, and live mobile previews out of the box!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

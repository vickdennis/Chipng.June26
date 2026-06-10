import React, { useState, useEffect } from "react";
import { api } from "./lib/api";
import { Profile, LinkItem, UserSession, ThemeConfig, NfcData } from "./types";
import NfcCard3D from "./components/NfcCard3D";
import ThemeSelector from "./components/ThemeSelector";
import LinkListManager from "./components/LinkListManager";
import AddEditLinkModal from "./components/AddEditLinkModal";
import NfcTagSettings from "./components/NfcTagSettings";
import { supabase } from "./lib/supabaseClient";
import { 
  Wifi, 
  User, 
  LogIn, 
  UserPlus, 
  Layout, 
  Eye, 
  Save, 
  LogOut, 
  Compass, 
  Settings, 
  Sparkles, 
  Check, 
  Copy, 
  AlertCircle,
  TrendingUp,
  Cpu,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Palette,
  Briefcase
} from "lucide-react";

export default function App() {
  // Navigation & Screen Control states
  const [currentScreen, setCurrentScreen] = useState<"landing" | "auth" | "dashboard" | "public">("landing");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [activeTab, setActiveTab] = useState<"profile" | "links" | "nfc" | "theme">("profile");

  // User Authentication sessions state
  const [currentUser, setCurrentUser] = useState<UserSession["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Authenticated states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [publicViewData, setPublicViewData] = useState<{ profile: Profile; links: LinkItem[] } | null>(null);

  // Form input bindings
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  
  // Dashboard form bindings
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedAvatar, setEditedAvatar] = useState("");

  // Modal control state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Dynamic preview/public link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-notification helper
  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Determine on mount if we have an active session or a public username path
  useEffect(() => {
    const initializeSessionAndPath = async () => {
      setIsLoading(true);
      
      const rawPath = window.location.pathname.replace(/^\//, "").trim();
      const path = decodeURIComponent(rawPath.split("/")[0]).trim();
      const isPublicProfilePath = path && !["dashboard", "auth", "login", "register", "index.html"].includes(path);

      let user = null;
      if (api.isUsingSupabase() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Retrieve username from user's public profile record if it exists
            const { data: profileRecord } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", session.user.id)
              .single();

            user = {
              id: session.user.id,
              email: session.user.email || "",
              username: profileRecord?.username || session.user.user_metadata?.username || ""
            };
          }
        } catch (err) {
          console.error("Supabase session recovery error:", err);
        }
      } else {
        user = api.auth.getCurrentUser();
      }

      if (user) {
        setCurrentUser(user);
        // Load user data in background or foreground
        try {
          const pData = await api.profile.get();
          setProfile(pData);
          setEditedDisplayName(pData.display_name || "");
          setEditedBio(pData.bio || "");
          setEditedAvatar(pData.avatar_url || "");
          const connections = await api.links.list();
          setLinks(connections);
        } catch (err) {
          console.error("Error loading user session details:", err);
        }
      }

      if (isPublicProfilePath) {
        await loadPublicProfile(path);
      } else if (user) {
        setCurrentScreen("dashboard");
      } else {
        setCurrentScreen("landing");
      }
      setIsLoading(false);
    };

    initializeSessionAndPath();
  }, []);

  // Update document/browser tab title dynamically based on the current screen
  useEffect(() => {
    if (currentScreen === "dashboard" && profile) {
      document.title = `${profile.display_name || profile.username} | Developer Dashboard — ChipNG`;
    } else if (currentScreen === "landing") {
      document.title = "ChipNG — Contactless NFC Smart Cards & Digital 3D Profiles";
    } else if (currentScreen === "auth") {
      document.title = "Initialize Secure Card | ChipNG Smart Profiles";
    }
  }, [currentScreen, profile]);

  // Fetch all profiles & links for authenticated user
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const pData = await api.profile.get();
      setProfile(pData);
      
      // Initialize editing fields
      setEditedDisplayName(pData.display_name || "");
      setEditedBio(pData.bio || "");
      setEditedAvatar(pData.avatar_url || "");

      const connections = await api.links.list();
      setLinks(connections);
    } catch (err: any) {
      showNotification(err.message || "Could not retrieve user data.", "error");
      // Force exit logged in state if auth token mismatch
      api.auth.signOut();
      setCurrentUser(null);
      setCurrentScreen("landing");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicProfile = async (username: string) => {
    setIsLoading(true);
    try {
      const data = await api.profile.getPublicProfile(username);
      setPublicViewData(data);
      setCurrentScreen("public");
    } catch (err: any) {
      showNotification("This ChipNG public profile is currently offline or does not exist.", "error");
      setPublicViewData(null);
      setCurrentScreen("landing");
    } finally {
      setIsLoading(false);
    }
  };

  // Authentication trigger routines
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      showNotification("Please provide both email and password.", "error");
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === "signup") {
        if (!usernameInput) {
          showNotification("Username is required for registration.", "error");
          setIsLoading(false);
          return;
        }

        // Validate duplicates directly
        const available = await api.profile.checkUsername(usernameInput);
        if (!available) {
          showNotification("Duplicate username detected. Please select a different username.", "error");
          setIsLoading(false);
          return;
        }

        const session = await api.auth.signUp(
          emailInput,
          passwordInput,
          usernameInput,
          displayNameInput || usernameInput
        );
        setCurrentUser(session.user);
        showNotification("Account registered successfully! Welcome to ChipNG.", "success");
      } else {
        const session = await api.auth.signIn(emailInput, passwordInput);
        setCurrentUser(session.user);
        showNotification("Welcome back! Redirecting to dashboard...", "success");
      }
      
      // Clean inputs
      setEmailInput("");
      setPasswordInput("");
      setUsernameInput("");
      setDisplayNameInput("");

      // Launch session load
      await loadUserData();
      setCurrentScreen("dashboard");
    } catch (err: any) {
      showNotification(err.message || "Failed authenticate credentials.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Log-out sequence
  const handleSignOut = async () => {
    await api.auth.signOut();
    setCurrentUser(null);
    setProfile(null);
    setLinks([]);
    showNotification("Logged out successfully.", "info");
    setCurrentScreen("landing");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("Selected file must be an image format (PNG, JPG, SVG, GIF, WebP).", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification("Image exceeds maximum 2MB constraint.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditedAvatar(reader.result);
        showNotification("Local avatar loaded into live preview!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Profile Save Actions
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsLoading(true);
      const updated = await api.profile.update({
        display_name: editedDisplayName,
        bio: editedBio,
        avatar_url: editedAvatar
      });
      setProfile(updated);
      showNotification("Display profile updated successfully!", "success");
    } catch (err: any) {
      showNotification(err.message || "Could not save profile details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Theme Update routine
  const handleThemeChange = async (updates: Partial<ThemeConfig>) => {
    if (!profile) return;
    try {
      const mergedTheme = { ...profile.theme, ...updates };
      setProfile({
        ...profile,
        theme: mergedTheme
      });
      // Persist to server backend/local-database
      await api.profile.update({ theme: mergedTheme });
    } catch (err: any) {
      showNotification("Could not sync visual theme options.", "error");
    }
  };

  // NFC Device mapping update
  const handleNfcDataChange = async (updates: Partial<NfcData>) => {
    if (!profile) return;
    try {
      const mergedNfc = { ...profile.nfc_data, ...updates } as NfcData;
      setProfile({
        ...profile,
        nfc_data: mergedNfc
      });
      await api.profile.update({ nfc_data: mergedNfc });
      showNotification("Physical tag configuration binding updated successfully.", "success");
    } catch (err: any) {
      showNotification("Could not sync NFC mapping coordinates.", "error");
    }
  };

  // Link modification actions
  const handleOpenAddLinkModal = () => {
    setEditingLink(null);
    setIsLinkModalOpen(true);
  };

  const handleOpenEditLinkModal = (linkItem: LinkItem) => {
    setEditingLink(linkItem);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = async (linkData: { title: string; url: string; icon: string; is_active: boolean }) => {
    try {
      setIsLoading(true);
      if (editingLink) {
        // Edit connection link
        const updated = await api.links.update(editingLink.id, linkData);
        setLinks(links.map(l => l.id === editingLink.id ? updated : l));
        showNotification("Connection link updated successfully.", "success");
      } else {
        // Create brand new connection link
        const created = await api.links.create(linkData);
        setLinks([...links, created]);
        showNotification("New connection link added!", "success");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to make link changes.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link connection?")) return;
    try {
      setIsLoading(true);
      await api.links.delete(id);
      setLinks(links.filter(l => l.id !== id));
      showNotification("Link removed successfully.", "success");
    } catch (err: any) {
      showNotification("Error removing link.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLinkActive = async (linkItem: LinkItem) => {
    try {
      const activeState = !linkItem.is_active;
      const updated = await api.links.update(linkItem.id, { is_active: activeState });
      setLinks(links.map(l => l.id === linkItem.id ? updated : l));
      showNotification(
        activeState ? "Link visible on public profile." : "Link hidden from public profile.", 
        "info"
      );
    } catch (err) {
      showNotification("Error toggling link visibility.", "error");
    }
  };

  const handleReorderLinks = async (reorderedIds: string[]) => {
    // Optimistic UI state update
    const mapped = reorderedIds.map((id, index) => {
      const match = links.find(l => l.id === id)!;
      return { ...match, order_index: index };
    });
    setLinks(mapped);

    try {
      await api.links.reorder(reorderedIds);
    } catch (err) {
      showNotification("Could not preserve ordering parameters on server.", "error");
    }
  };

  // Copy link utility
  const getPublicUrl = () => {
    const un = profile?.username || "demo";
    return `${window.location.origin}/${un}`;
  };

  const handleCopyPublicUrl = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopiedLink(true);
    showNotification("Profile public URL copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Generate downloadable vCard context
  const handleDownloadVCard = (targetProfile: Profile) => {
    const dName = targetProfile.display_name || targetProfile.username;
    const notes = targetProfile.bio || "Shared via ChipNG smart connection.";
    
    // Build continuous standard vCard text payload
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${dName}`,
      `N:;${dName};;;`,
      `NOTE:${notes.replace(/\n/g, ' ')}`,
      `URL;type=pref:${window.location.origin}/${targetProfile.username}`,
      "END:VCARD"
    ].join("\r\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${targetProfile.username}_contact.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="min-h-screen text-slate-300 flex flex-col transition-colors duration-500 overflow-x-hidden font-sans"
      style={{ 
        backgroundColor: currentScreen === "public" && publicViewData 
          ? publicViewData.profile.theme.backgroundColor 
          : profile 
            ? profile.theme.backgroundColor 
            : "#0A0A0A"
      }}
    >
      {/* Toast Alert Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md animate-fade-in"
          style={{
            backgroundColor: notification.type === "error" ? "rgba(239, 68, 68, 0.15)" : notification.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(30, 41, 59, 0.7)",
            borderColor: notification.type === "error" ? "rgba(239, 68, 68, 0.4)" : notification.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)"
          }}
        >
          {notification.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className={`text-xs font-bold ${notification.type === "error" ? "text-red-400" : "text-white"}`}>
              {notification.type === "error" ? "System Error Alert" : "Notification Manager"}
            </span>
            <p className="text-xs text-neutral-300 leading-normal mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* RENDER SCREEN 1: LANDING/MARKETING PAGE */}
      {currentScreen === "landing" && (
        <div id="landing-screen" className="flex flex-col flex-1 relative overflow-hidden bg-[#0A0A0A]">
          {/* Visual gradient light ambient circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[140px]" />
            <div className="absolute top-[40%] right-[15%] w-[30%] h-[30%] bg-amber-500/10 rounded-full blur-[120px]" />
          </div>

          {/* Premium Header Navigation */}
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 md:px-12 bg-zinc-900/50 backdrop-blur-xl shrink-0 z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                C
              </div>
              <span className="text-white font-bold tracking-tight text-xl">ChipNG</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                V2.6 Live Build
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setCurrentScreen("auth");
                }}
                className="px-4 py-1.5 text-xs font-semibold hover:text-white transition-colors text-neutral-300"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setCurrentScreen("auth");
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20"
              >
                Register Card
              </button>
            </div>
          </header>

          {/* Landing Core Body Content */}
          <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 md:py-20 text-center max-w-5xl mx-auto z-10 space-y-10">
            {/* Visual Micro branding banner */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-zinc-300 font-mono tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              PHYSICAL TO DIGITAL METALLIC NFC CHIP TECHNOLOGY
            </div>

            {/* Title Statement */}
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Your Professional Identity,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400">
                Transmitted via Contactless Tap.
              </span>
            </h1>

            {/* Accompanying pitch */}
            <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              ChipNG is a high-density, customizable link-in-bio SaaS built for modern networkers. 
              Configure an elegant 3D digital smart card, link it to any rewriteable NFC tag, 
              and download immediate vCard coordinates instantly.
            </p>

            {/* Action controls */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setCurrentScreen("auth");
                }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 font-bold text-sm text-black rounded-full transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Initialize Custom Profile</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  // Simulate guest mode using demo data, or load local default
                  setIsLoading(true);
                  try {
                    // Try to log in with direct demo account parameters natively
                    const session = await api.auth.signIn("demo@chipng.co", "demo123");
                    setCurrentUser(session.user);
                    await loadUserData();
                    setCurrentScreen("dashboard");
                    showNotification("Logged in seamlessly as Demo Guest!", "success");
                  } catch (err) {
                    // If login failed, register demo on server first
                    try {
                      const session = await api.auth.signUp("demo@chipng.co", "demo123", "vickthor", "Victor Dennis");
                      setCurrentUser(session.user);
                      await loadUserData();
                      setCurrentScreen("dashboard");
                      showNotification("Demo profile set up successfully!", "success");
                    } catch {
                      showNotification("Demo session database offline.", "error");
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-white font-semibold text-sm rounded-full transition-all flex items-center justify-center gap-2"
              >
                <span>Live Interactive Sandbox Demo</span>
              </button>
            </div>

            {/* Feature Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left max-w-4xl mx-auto w-full">
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3 hover:border-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-white text-base font-semibold">Physical NFC Pairing</h3>
                <p className="text-xs text-neutral-400 leading-normal">
                  Map NFC serial ids to cold metallic smart cards. Compatible with routine iOS & Android tap sharing systems natively.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3 hover:border-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <span className="material-symbols-outlined text-[20px] font-bold">Layers</span>
                </div>
                <h3 className="text-white text-base font-semibold">Interactive 3D Cards</h3>
                <p className="text-xs text-neutral-400 leading-normal">
                  Stunning responsive 3D card layout engine which tilts dynamically on desktop mouse moves and mobile gyroscope flips.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3 hover:border-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-white text-base font-semibold">vCard Instant Contact</h3>
                <p className="text-xs text-neutral-400 leading-normal">
                  Let prospects download your verified contact data, links, or emails directly to their native device phonebooks.
                </p>
              </div>
            </div>
          </main>

          {/* Premium Footer */}
          <footer className="h-16 border-t border-white/5 flex items-center justify-center text-[11px] text-zinc-500 font-mono z-10 shrink-0">
            © 2026 CHIPNG TECHNOLOGIES INC. • BUILT IN HIGH DENSITY COLD STEEL WORKSPACE
          </footer>
        </div>
      )}

      {/* RENDER SCREEN 2: AUTHENTICATION CONTAINER (SIGN UP / SIGN IN) */}
      {currentScreen === "auth" && (
        <div id="auth-screen" className="flex flex-col flex-1 justify-center items-center p-4 relative bg-[#0A0A0A]">
          {/* Glass background details */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] bg-indigo-500/15 rounded-full blur-[100px]" />
            <div className="absolute bottom-[25%] right-[25%] w-[35%] h-[35%] bg-amber-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="w-full max-w-md bg-zinc-900/85 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-2xl z-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-400" />
            
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setCurrentScreen("landing")}
                className="text-xs text-zinc-500 hover:text-white transition-colors hover:underline"
              >
                ← Back to Homepage
              </button>
              <h2 className="text-2xl font-black text-white tracking-tight mt-2">
                {authMode === "signup" ? "Create your smart card profile" : "Log in to your dashboard"}
              </h2>
              <p className="text-xs text-neutral-400">
                {authMode === "signup" 
                  ? "A single tap connects you with the physical and digital world." 
                  : "Welcome back. Access your links and paired NFC status."}
              </p>
            </div>

            {/* Error alerts or helpful guides */}
            <div className="p-3 bg-white/5 border border-white/15 rounded-lg text-[11px] text-zinc-300 leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                {!api.isUsingSupabase() 
                  ? "You are running in sandbox local state mode. All profiles and credentials run safely inside local container structures."
                  : "You are integrating directly with live Supabase Authentication services."}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Pick Public Username (URL handle)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. jsterling, vickthor"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full bg-black/50 text-sm text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Full Name / Display Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jordan Sterling"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      className="w-full bg-black/50 text-sm text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-black/50 text-sm text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-black/50 text-sm text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold text-xs text-white uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/20 shrink-0"
              >
                {isLoading ? "Synchronizing server databases..." : authMode === "signup" ? "Confirm Registration" : "Enter Secure Area"}
              </button>
            </form>

            {/* Switch authentication modes */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                className="text-xs text-zinc-300 hover:text-white hover:underline transition-colors focus:outline-none"
              >
                {authMode === "signup" 
                  ? "Already have an activated profile? Sign In" 
                  : "Need a premium metallic card? Start Registration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER SCREEN 3: PROTECTED ADMIN DASHBOARD (HIGH DENSITY THEMED) */}
      {currentScreen === "dashboard" && profile && (
        <div id="dashboard-screen" className="flex flex-col flex-1 overflow-hidden bg-[#0A0A0A] h-[768px] relative">
          
          {/* Header Navigation Bar */}
          <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 md:px-8 bg-zinc-900/50 backdrop-blur-xl shrink-0 z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-lg flex items-center justify-center font-bold text-white">
                  C
                </div>
                <span className="text-white font-bold tracking-tight text-xl">ChipNG</span>
              </div>
              
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              
              {/* High Density Tabs design */}
              <div className="hidden sm:flex gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "profile" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" : "hover:bg-white/5 text-neutral-300 hover:text-white"
                  }`}
                >
                  Editor Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("links")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "links" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" : "hover:bg-white/5 text-neutral-300 hover:text-white"
                  }`}
                >
                  Link Manager
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("theme")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "theme" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" : "hover:bg-white/5 text-neutral-300 hover:text-white"
                  }`}
                >
                  Custom Materials
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("nfc")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "nfc" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" : "hover:bg-white/5 text-neutral-300 hover:text-white"
                  }`}
                >
                  NFC Tag Configuration
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20">
                System Live
              </span>

              {/* Directly load public profile in single-tab view */}
              <button
                type="button"
                onClick={() => loadPublicProfile(profile.username)}
                className="text-neutral-400 hover:text-white p-2 rounded-lg bg-zinc-800/40 border border-white/5 hover:border-white/10 transition-all text-xs flex items-center gap-1.5 font-medium"
                title="View public smart card profile link"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Public Link</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>

          {/* Quick Responsive bar for tabs on ultra-small viewports */}
          <div className="sm:hidden grid grid-cols-4 bg-zinc-950 border-b border-white/5 p-1 text-center shrink-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 text-[10px] font-semibold uppercase tracking-wider ${activeTab === "profile" ? "text-amber-500 border-b-2 border-amber-500" : "text-neutral-400"}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={`py-2 text-[10px] font-semibold uppercase tracking-wider ${activeTab === "links" ? "text-amber-500 border-b-2 border-amber-500" : "text-neutral-400"}`}
            >
              Links
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={`py-2 text-[10px] font-semibold uppercase tracking-wider ${activeTab === "theme" ? "text-amber-500 border-b-2 border-amber-500" : "text-neutral-400"}`}
            >
              Themes
            </button>
            <button
              onClick={() => setActiveTab("nfc")}
              className={`py-2 text-[10px] font-semibold uppercase tracking-wider ${activeTab === "nfc" ? "text-amber-500 border-b-2 border-amber-500" : "text-neutral-400"}`}
            >
              NFC
            </button>
          </div>

          {/* Core Layout Panels splitting configuration on Left & Live Preview on Right */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT CONFIGURATION ASIDE COLUMN */}
            <aside className="w-full md:w-[480px] shrink-0 border-r border-white/10 flex flex-col p-6 gap-6 bg-zinc-900/30 overflow-y-auto min-h-0">
              
              {/* SUBPANEL STATE A: PROFILE CONFIGURATION EDITOR */}
              {activeTab === "profile" && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                      Display Credentials
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-1 mb-4">
                      Customize display coordinates mapping onto your physically tapped smart metal cards.
                    </p>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      {/* Avatar preview and edit */}
                      <div className="space-y-3">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-4 items-center">
                          <label className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0 cursor-pointer group hover:border-amber-500/50 transition-all select-none">
                            {editedAvatar ? (
                              <img src={editedAvatar} alt="preview" className="w-full h-full object-cover transition-opacity group-hover:opacity-60" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-xl text-neutral-400 font-bold group-hover:opacity-40">{editedDisplayName.substring(0,2).toUpperCase() || "CN"}</span>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[9px] text-white font-mono uppercase font-bold text-center">Upload</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                              <span>Profile Avatar Coordinate</span>
                              <span className="text-[9px] text-indigo-400 font-mono tracking-tight cursor-default">(Click photo box to upload custom)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/photo-..."
                              value={editedAvatar}
                              onChange={(e) => setEditedAvatar(e.target.value)}
                              className="bg-transparent border-none text-zinc-200 text-xs p-0 focus:ring-0 w-full focus:outline-none placeholder-zinc-600 mt-0.5 truncate"
                            />
                          </div>
                        </div>

                        {/* Presets Row */}
                        <div className="space-y-1.5">
                          <span className="block text-[9px] font-semibold text-neutral-400 font-mono uppercase">Or map one of our premium portrait presets:</span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {[
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150"
                            ].map((presetUrl, idx) => (
                              <button
                                key={presetUrl}
                                type="button"
                                onClick={() => {
                                  setEditedAvatar(presetUrl);
                                  showNotification(`Elegant preset Portrait ${idx + 1} chosen.`, "success");
                                }}
                                className={`w-8 h-8 rounded-full overflow-hidden border shrink-0 transition-all hover:scale-110 active:scale-95 ${editedAvatar === presetUrl ? 'border-amber-500 scale-105 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'border-white/10'}`}
                              >
                                <img src={presetUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Name Input */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          Representative Full Name
                        </label>
                        <input
                          type="text"
                          value={editedDisplayName}
                          onChange={(e) => setEditedDisplayName(e.target.value)}
                          placeholder="e.g. Victor Dennis"
                          className="w-full bg-black/50 text-sm text-white border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Bio text block */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          Public Mini Biography
                        </label>
                        <textarea
                          rows={3}
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          placeholder="Build the next frontier of metal chip contact profiles..."
                          className="w-full bg-black/50 text-xs text-white border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isLoading ? "Saving options..." : "Save Profile Details"}</span>
                      </button>
                    </form>
                  </div>

                  {/* Profile statistics / Quick view details representing user settings */}
                  <div className="border-t border-white/10 pt-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Smart Metadata Status
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                        <span className="text-zinc-500 block uppercase text-[9px]">ACTIVE USERNAME</span>
                        <span className="text-white font-medium truncate block">@{profile.username}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                        <span className="text-zinc-500 block uppercase text-[9px]">AUTHENTICATOR</span>
                        <span className="text-white font-medium truncate block">Email auth</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* SUBPANEL STATE B: LINK LIST MANAGER */}
              {activeTab === "links" && (
                <section>
                  <LinkListManager
                    links={links}
                    onEdit={handleOpenEditLinkModal}
                    onDelete={handleDeleteLink}
                    onToggleActive={handleToggleLinkActive}
                    onReorder={handleReorderLinks}
                    onAddTrigger={handleOpenAddLinkModal}
                  />
                </section>
              )}

              {/* SUBPANEL STATE C: COLOR MATERIALS & ESTHETICS THEMES */}
              {activeTab === "theme" && (
                <section>
                  <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Card Customization
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Choose card material themes, light alignments, gradients, and custom glassmorphism finishes.
                    </p>
                  </div>
                  <ThemeSelector
                    theme={profile.theme}
                    onChange={handleThemeChange}
                  />
                </section>
              )}

              {/* SUBPANEL STATE D: PHYSICAL NFC TAG ALIGNMENT */}
              {activeTab === "nfc" && (
                <section>
                  <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      NFC Hardware Settings
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Manage coordinates linking physical steel cards and tags directly to internet bio properties.
                    </p>
                  </div>
                  <NfcTagSettings
                    nfcData={profile.nfc_data}
                    onChange={handleNfcDataChange}
                    publicUrl={getPublicUrl()}
                  />
                </section>
              )}

            </aside>

            {/* RIGHT STANDALONE DEVICE MOCKUP PREVIEW AREA */}
            <section className="flex-1 bg-[#050505] relative flex items-center justify-center p-6 md:p-12 overflow-y-auto">
              
              {/* Backglow lights */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div 
                  className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] opacity-40 transition-colors duration-1000" 
                  style={{ backgroundColor: `${profile.theme.primaryColor}30` }}
                />
                <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-zinc-950 rounded-full blur-[140px]" />
              </div>

              {/* Device container */}
              <div className="w-[320px] h-[640px] bg-zinc-950 rounded-[48px] border-[8px] border-zinc-800 shadow-2xl relative flex flex-col p-6 overflow-hidden ring-1 ring-white/10 shrink-0">
                {/* Speaker pill notch */}
                <div className="w-32 h-6 bg-zinc-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20" />
                
                {/* Simulated upper menu */}
                <div className="w-full flex justify-between items-center mb-4 shrink-0 text-white/50 text-xs">
                  <span className="font-mono text-[10px]">9:41</span>
                  <div className="flex gap-1 items-center">
                    <Wifi className="w-3 h-3 text-white/60" />
                    <span className="text-[9px] font-mono">5G</span>
                    <div className="w-4 h-2 rounded-sm border border-white/40 p-[1px] flex"><div className="w-full h-full bg-white/80 rounded-2xs" /></div>
                  </div>
                </div>

                {/* Main scrollable body wrapper of preview details */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth space-y-6 pt-1">
                  
                  {/* Dynamic 3D Card tilt previews */}
                  <div className="shrink-0">
                    <NfcCard3D
                      displayName={editedDisplayName}
                      bio={editedBio}
                      avatarUrl={editedAvatar}
                      theme={profile.theme}
                      nfcData={profile.nfc_data}
                      username={profile.username}
                    />
                  </div>

                  {/* Public biography details */}
                  <div className="text-center shrink-0 px-2 space-y-1.5">
                    <h4 className="text-white font-bold text-lg tracking-tight">
                      {editedDisplayName || "Your Name"}
                    </h4>
                    <p className="text-zinc-500 text-xs leading-normal">
                      {editedBio || "Build a spectacular minimal touch profile..."}
                    </p>
                  </div>

                  {/* Connection Links Render */}
                  <div className="flex flex-col gap-2.5 shrink-0 px-1">
                    {links.filter(l => l.is_active).length === 0 ? (
                      <div className="p-4 text-center rounded-xl bg-white/5 border border-white/5 text-[11px] text-zinc-500">
                        No active connections configured.
                      </div>
                    ) : (
                      links.filter(l => l.is_active).map((link) => (
                        <div 
                          key={link.id}
                          className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 gap-3 text-left hover:bg-white/10 transition-colors"
                        >
                          <div className="w-7 h-7 rounded bg-black flex items-center justify-center shrink-0">
                            {/* Standard fallback badge indicator mapping icon */}
                            <span className="text-[10px] uppercase font-mono text-amber-500">{link.icon.substring(0,3)}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-white text-xs font-semibold truncate leading-tight">{link.title}</span>
                            <span className="text-[9px] text-neutral-500 truncate font-mono mt-0.5">{link.url.replace(/^https?:\/\//, "")}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Save Contact action directly */}
                  <div className="pt-2 shrink-0 px-1 pb-4">
                    <button
                      type="button"
                      onClick={() => handleDownloadVCard(profile)}
                      className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <span>Save Connection Context</span>
                    </button>
                  </div>

                </div>

                {/* Screen Bottom indicator bar */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
              </div>

              {/* Indicator mode badge */}
              <div className="absolute bottom-4 right-4 flex items-center gap-4">
                <div className="p-2.5 bg-zinc-900 border border-white/10 rounded-lg text-[10px] font-mono text-zinc-500 uppercase">
                  Preview Mode: Live Mobile View
                </div>
              </div>

            </section>
          </div>
        </div>
      )}

      {/* RENDER SCREEN 4: DETACHED standalone public endpoint link page */}
      {currentScreen === "public" && publicViewData && (
        <div id="public-screen" className="flex-1 flex flex-col justify-center items-center p-6 min-h-screen relative overflow-hidden">
          {/* Ambient card color spots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] opacity-25" 
              style={{ backgroundColor: `${publicViewData.profile.theme.primaryColor}40` }}
            />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-950 rounded-full blur-[140px]" />
          </div>

          <div className="w-full max-w-sm space-y-8 text-center relative z-10 py-12">
            
            {/* Quick Home action for evaluation review */}
            <div className="flex justify-between items-center mb-2 px-1">
              <button
                type="button"
                onClick={() => {
                  const user = api.auth.getCurrentUser();
                  if (user) {
                    setCurrentScreen("dashboard");
                  } else {
                    setCurrentScreen("landing");
                  }
                }}
                className="text-xs text-zinc-500 hover:text-white transition-all bg-white/5 border border-white/5 px-3 py-1.5 rounded-full"
              >
                ← Return to Platform
              </button>
              
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                Tap Profile Verified
              </span>
            </div>

            {/* Massive interactive 3D Card tilt */}
            <NfcCard3D
              displayName={publicViewData.profile.display_name || publicViewData.profile.username}
              bio={publicViewData.profile.bio || ""}
              avatarUrl={publicViewData.profile.avatar_url || ""}
              theme={publicViewData.profile.theme}
              nfcData={publicViewData.profile.nfc_data}
              username={publicViewData.profile.username}
            />

            {/* Profile Credentials text */}
            <div className="space-y-2 px-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {publicViewData.profile.display_name || publicViewData.profile.username}
              </h2>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
                {publicViewData.profile.bio || "Building connection pathways with ChipNG physical metals."}
              </p>
            </div>

            {/* Links output stream */}
            <div className="space-y-3 px-1">
              {publicViewData.links.length === 0 ? (
                <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-xs text-zinc-500">
                  This user has not established any active subfield connection mappings.
                </div>
              ) : (
                publicViewData.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 bg-white/5 border border-white/10 hover:border-white/20 hover:scale-[1.01] rounded-2xl flex items-center justify-between transition-all text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center shrink-0">
                        <span className="text-[11px] uppercase font-mono text-amber-400">{link.icon.substring(0,3)}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-sm font-semibold truncate leading-snug">{link.title}</span>
                        <span className="text-[10px] text-zinc-500 truncate">{link.url.replace(/^https?:\/\//, "")}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                  </a>
                ))
              )}
            </div>

            {/* Primary Save vCard download button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleDownloadVCard(publicViewData.profile)}
                className="w-full py-4 bg-white hover:bg-neutral-200 text-black text-sm font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-xl transition-all"
              >
                <span>Add Directly to Contacts (vCard)</span>
              </button>
            </div>

            {/* Brand promotion */}
            <p className="text-[10px] text-zinc-600 font-mono pt-8">
              POWERED BY CHIPNG NFC HARDWARE NETWORKS
            </p>

          </div>
        </div>
      )}

      {/* MODAL WINDOWS CONTROLS */}
      <AddEditLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveLink}
        editingLink={editingLink}
      />
    </div>
  );
}

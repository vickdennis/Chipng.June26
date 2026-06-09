import React, { useState, useEffect } from "react";
import { Profile, LinkItem, ThemeConfig } from "../types";
import { api } from "../lib/api";
import NfcCard3D from "./NfcCard3D";
import ThemeSelector from "./ThemeSelector";
import LinkListManager from "./LinkListManager";
import AddEditLinkModal from "./AddEditLinkModal";
import NfcTagSettings from "./NfcTagSettings";
import { 
  User, 
  Palette, 
  Share2, 
  Wifi, 
  LogOut, 
  ExternalLink, 
  Sparkles, 
  Database, 
  RefreshCw,
  Layout,
  AlertTriangle
} from "lucide-react";

interface DashboardEditorProps {
  onLogout: () => void;
}

const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400"
];

export default function DashboardEditor({ onLogout }: DashboardEditorProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "links" | "theme" | "nfc">("profile");
  
  // Modals state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  
  // Async feedback status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState({ text: "", type: "success" });
  
  // Profile Form fields
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Load existing profile & links
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userProfile = await api.profile.get();
        setProfile(userProfile);
        
        // populate form fields
        setUsername(userProfile.username);
        setDisplayName(userProfile.display_name || "");
        setBio(userProfile.bio || "");
        setAvatarUrl(userProfile.avatar_url || "");

        const userLinks = await api.links.list();
        setLinks(userLinks);
      } catch (err) {
        console.error("Error loading account data", err);
        triggerNotification("Could not communicate with profile cloud store.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Username live clash checking helper
  useEffect(() => {
    if (!username || !profile) return;
    const cleanUsername = username.toLowerCase().trim();
    if (cleanUsername === profile.username) {
      setUsernameAvailable(true);
      return;
    }

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
  }, [username, profile]);

  const triggerNotification = (text: string, type: "success" | "error" = "success") => {
    setNotifyMsg({ text, type });
    setTimeout(() => setNotifyMsg({ text: "", type: "success" }), 4000);
  };

  // Profile fields submit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (usernameAvailable === false) {
      triggerNotification("Please select an available unique username.", "error");
      return;
    }

    try {
      setSaving(true);
      const updated = await api.profile.update({
        display_name: displayName,
        bio: bio,
        avatar_url: avatarUrl,
        username: username.toLowerCase().trim()
      });
      setProfile(updated);
      triggerNotification("ChipNG profile updated successfully!");
    } catch (err: any) {
      triggerNotification(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // Live save for theme configs
  const handleThemeChange = async (themeUpdates: Partial<ThemeConfig>) => {
    if (!profile) return;
    // optimistic update for UI speed
    const updatedTheme = { ...profile.theme, ...themeUpdates };
    setProfile(prev => prev ? { ...prev, theme: updatedTheme } : null);

    try {
      await api.profile.update({ theme: themeUpdates });
    } catch {
      triggerNotification("Warning: Theme config not synced in cloud store.", "error");
    }
  };

  // Live save for NFC Tag configs
  const handleNfcChange = async (nfcUpdates: Partial<Profile["nfc_data"]>) => {
    if (!profile) return;
    const updatedNfc = { ...profile.nfc_data, ...nfcUpdates };
    setProfile(prev => prev ? { ...prev, nfc_data: updatedNfc } : null);

    try {
      await api.profile.update({ nfc_data: nfcUpdates });
    } catch {
      triggerNotification("Failed to sync NFC hardware map configuration.", "error");
    }
  };

  // Connection Link CRUD Ops
  const handleAddLink = () => {
    setEditingLink(null);
    setIsLinkModalOpen(true);
  };

  const handleEditLink = (linkItem: LinkItem) => {
    setEditingLink(linkItem);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = async (formData: { title: string; url: string; icon: string; is_active: boolean }) => {
    try {
      if (editingLink) {
        // UPDATE
        const updated = await api.links.update(editingLink.id, formData);
        setLinks(prev => prev.map(l => l.id === editingLink.id ? updated : l));
        triggerNotification("Connection link updated.");
      } else {
        // CREATE
        const created = await api.links.create(formData);
        setLinks(prev => [...prev, created]);
        triggerNotification("New connection link added!");
      }
    } catch (err: any) {
      triggerNotification(err.message || "Error saving link connection.", "error");
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection link?")) return;
    try {
      await api.links.delete(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      triggerNotification("Connection link removed.");
    } catch {
      triggerNotification("Could not delete connection from database.", "error");
    }
  };

  const handleToggleActiveLink = async (linkItem: LinkItem) => {
    const nextActive = !linkItem.is_active;
    // Optimistic UI update
    setLinks(prev => prev.map(l => l.id === linkItem.id ? { ...l, is_active: nextActive } : l));
    
    try {
      await api.links.update(linkItem.id, { is_active: nextActive });
    } catch {
      triggerNotification("Failed to adjust link visibility.", "error");
      // revert
      setLinks(prev => prev.map(l => l.id === linkItem.id ? { ...l, is_active: !nextActive } : l));
    }
  };

  const handleReorderLinks = async (reorderedIds: string[]) => {
    // Reorder links array in UI state first for smooth animation
    const reorderedList = reorderedIds.map((id, index) => {
      const match = links.find(l => l.id === id);
      return { ...match!, order_index: index };
    });
    setLinks(reorderedList);

    try {
      await api.links.reorder(reorderedIds);
    } catch {
      triggerNotification("Error persisting layout reorder index.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col justify-center items-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold font-mono animate-pulse">
          Connecting to ChipNG Storage...
        </p>
      </div>
    );
  }

  const userTheme = profile?.theme || { primaryColor: "#6366f1", backgroundColor: "#0f172a", cardStyle: "glassmorphism", textColor: "#ffffff" };
  const nfcDataObj = profile?.nfc_data || { serialNumber: null, activationStatus: "pending" };
  const publicLiveUrl = `${window.location.origin}/preview/${profile?.username || username}`;

  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col">
      
      {/* Header bar */}
      <header className="border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Wifi className="w-5 h-5 text-black stroke-[3px]" />
          </div>
          <div>
            <span className="text-sm font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
              CHIPNG
            </span>
            <div className="flex items-center space-x-1.5 leading-none mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-neutral-400">
                {api.isUsingSupabase() ? "PRODUCTION SUPABASE" : "SANDBOX INTERACTIVE"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={`/preview/${profile?.username}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-lg border border-white/10 transition-all text-neutral-300 hover:text-white"
          >
            <span>My Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Log out of session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main administrative body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Customization Workspaces */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Notification banner */}
          {notifyMsg.text && (
            <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
              notifyMsg.type === "error" 
                ? "bg-red-500/10 border-red-500/30 text-red-400" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{notifyMsg.text}</span>
            </div>
          )}

          {/* Selector Navigation */}
          <div className="flex bg-neutral-900/60 p-1.5 rounded-xl border border-white/5 space-x-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "profile" 
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/10" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Bio Card</span>
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "links" 
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/10" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Links</span>
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "theme" 
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/10" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme</span>
            </button>
            <button
              onClick={() => setActiveTab("nfc")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "nfc" 
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/10" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>NFC Hardware</span>
            </button>
          </div>

          {/* Active Tab Container Panel */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm min-h-[400px]">
            
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Modify Display Bio</h3>
                  <p className="text-xs text-neutral-400 leading-normal mt-0.5">
                    This content populates the interactive digital smart metal card.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Victor Dennis"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-black/40 text-sm text-white border border-white/10 rounded-lg px-3 py-2 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  {/* Public Username */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Username (Bio URL Link)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. vickthor"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full bg-black/40 text-sm text-white border rounded-lg pl-3 pr-10 py-2 focus:outline-none font-mono ${
                          usernameAvailable === true 
                            ? "border-emerald-500/50" 
                            : usernameAvailable === false 
                              ? "border-rose-500/50" 
                              : "border-white/10"
                        }`}
                      />
                      <div className="absolute right-3 top-2.5">
                        {checkingUsername ? (
                          <RefreshCw className="w-4 h-4 text-neutral-400 animate-spin" />
                        ) : usernameAvailable === true ? (
                          <span className="text-[9px] font-bold font-mono text-emerald-400 uppercase">OK</span>
                        ) : usernameAvailable === false ? (
                          <span className="text-[9px] font-bold font-mono text-rose-400 uppercase">Clash</span>
                        ) : null}
                      </div>
                    </div>
                    {usernameAvailable === false && (
                      <p className="text-[10px] text-rose-400 leading-normal mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Selected handle is taken or malformed (3-15 alphanumeric/underscores).
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile Picture (Preloaded elegant Avatars or Custom URL input) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Profile Picture Avatar
                  </label>
                  <div className="flex flex-wrap gap-3 items-center mb-3">
                    {AVATAR_POOL.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 shrink-0 ${
                          avatarUrl === url ? "border-amber-500" : "border-white/10"
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-400 font-mono mb-1">Or input custom file image URL</span>
                    <input
                      type="url"
                      placeholder="e.g. https://domain.co/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full bg-black/40 text-xs text-white border border-white/10 rounded-lg px-3 py-2 focus:border-amber-500/50 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Bio Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Creative Bio Description
                  </label>
                  <textarea
                    placeholder="Describe yourself to anyone tapping your tag card..."
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={160}
                    className="w-full bg-black/40 text-sm text-white border border-white/10 rounded-lg px-3 py-2.5 focus:border-amber-500/50 focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-end text-[10px] text-neutral-500 mt-0.5">
                    {bio.length}/160 characters
                  </div>
                </div>

                {/* Submit button */}
                <div className="border-t border-white/5 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 disabled:opacity-60 text-sm font-bold text-black rounded-xl transition-all shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
                  >
                    {saving ? "Saving Changes..." : "Apply Profile Updates"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "links" && (
              <LinkListManager
                links={links}
                onEdit={handleEditLink}
                onDelete={handleDeleteLink}
                onToggleActive={handleToggleActiveLink}
                onReorder={handleReorderLinks}
                onAddTrigger={handleAddLink}
              />
            )}

            {activeTab === "theme" && (
              <ThemeSelector
                theme={userTheme}
                onChange={handleThemeChange}
              />
            )}

            {activeTab === "nfc" && (
              <NfcTagSettings
                nfcData={nfcDataObj}
                onChange={handleNfcChange}
                publicUrl={publicLiveUrl}
              />
            )}

          </div>

        </div>

        {/* Right Side: High-fidelity Live Mobile Mockup Rendering */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="w-full text-center mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Live 3D Tap Card preview
            </span>
          </div>

          {/* Interactive Mobile Device Frame */}
          <div className="relative w-full max-w-[325px] aspect-[9/18.5] bg-[#0c0c0e] rounded-[50px] border-[5px] border-neutral-800 p-3.5 shadow-2xl flex flex-col overflow-hidden group">
            {/* Camera speaker notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-4 w-28 bg-neutral-800 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-neutral-900 mr-2 shrink-0" />
              <div className="w-8 h-1 rounded-full bg-neutral-900" />
            </div>

            {/* Inner iframe content view mockup */}
            <div 
              className="flex-1 rounded-[38px] flex flex-col overflow-y-auto px-4 py-8 relative no-scrollbar"
              style={{ backgroundColor: userTheme.backgroundColor }}
            >
              
              {/* Profile card 3D projection */}
              <div className="mt-2 scale-90 origin-top">
                <NfcCard3D
                  displayName={displayName || "Display Name"}
                  bio={bio || "Design biography representation."}
                  avatarUrl={avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                  theme={userTheme}
                  nfcData={nfcDataObj}
                  username={username || "username"}
                />
              </div>

              {/* vCard Save button mockup */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-bold text-xs mt-3 select-none flex items-center justify-center space-x-1 border transition-all text-black bg-amber-500 border-transparent shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
              >
                <span>Save Digital Contact (vCard)</span>
              </button>

              {/* Glowing active links mockup lists */}
              <div className="space-y-2 mt-6 flex-1">
                {links.filter(l => l.is_active).map((link) => {
                  return (
                    <div
                      key={link.id}
                      className="p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-neutral-200 text-xs w-full hover:bg-white/5 cursor-pointer backdrop-blur-sm self-stretch transition-transform hover:scale-[1.01]"
                    >
                      <span className="font-semibold truncate">{link.title}</span>
                      <span className="text-[10px] font-mono text-neutral-400">Connect</span>
                    </div>
                  );
                })}

                {links.filter(l => l.is_active).length === 0 && (
                  <div className="text-center py-6">
                    <span className="text-[10px] text-neutral-500 font-mono italic">
                      Add and toggle visible connections in the links tab.
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom footer stamp */}
              <div className="text-center mt-6 pt-3 border-t border-white/5 opacity-50">
                <span className="text-[8px] font-mono tracking-wider uppercase text-neutral-500">
                  SHAPED BY CHIPNG v2
                </span>
              </div>

            </div>
          </div>

          <p className="text-[10px] text-neutral-500 italic mt-3 text-center max-w-xs leading-normal">
            Move mouse directly over the mobile card visual to tilt the physical 3D chip representation on hover.
          </p>

        </div>

      </main>

      {/* Add / Edit Links Modal */}
      <AddEditLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveLink}
        editingLink={editingLink}
      />
    </div>
  );
}

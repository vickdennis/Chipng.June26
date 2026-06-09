import React, { useEffect, useState } from "react";
import { Profile, LinkItem } from "../types";
import { api } from "../lib/api";
import NfcCard3D from "./NfcCard3D";
import { 
  Wifi, 
  UserPlus, 
  ExternalLink, 
  RefreshCw, 
  Compass, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github, 
  Youtube, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare,
  Link2,
  Bookmark
} from "lucide-react";
import { AVAILABLE_ICONS } from "./AddEditLinkModal";

interface PublicProfileViewProps {
  usernameParam: string;
}

export default function PublicProfileView({ usernameParam }: PublicProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadPublic() {
      try {
        setLoading(true);
        const data = await api.profile.getPublicProfile(usernameParam);
        setProfile(data.profile);
        setLinks(data.links);
      } catch (err: any) {
        console.error("Error loading profile", err);
        setErrorMsg("The requested ChipNG profile has not been activated yet.");
      } finally {
        setLoading(false);
      }
    }
    loadPublic();
  }, [usernameParam]);

  // vCard file builder helper to save directly to phone memory
  const handleDownloadvCard = () => {
    if (!profile) return;

    let telephone = "";
    // look for an active phone link to inject as the direct cell
    const phoneLink = links.find(l => l.icon === 'phone' || l.url.startsWith('tel:'));
    if (phoneLink) {
      telephone = phoneLink.url.replace("tel:", "").trim();
    }

    let emailVal = "";
    const emailLink = links.find(l => l.icon === 'mail' || l.url.startsWith('mailto:'));
    if (emailLink) {
      emailVal = emailLink.url.replace("mailto:", "").trim();
    }

    const vCardContent = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${profile.display_name || profile.username}`,
      `N:;${profile.display_name || profile.username};;;`,
      profile.bio ? `NOTE:${profile.bio.replace(/\n/g, ' ')}` : "",
      telephone ? `TEL;TYPE=CELL:${telephone}` : "",
      emailVal ? `EMAIL;TYPE=PREF,INTERNET:${emailVal}` : "",
      `URL:${window.location.origin}/preview/${profile.username}`,
      "END:VCARD"
    ].filter(Boolean).join("\r\n");

    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement("a");
    linkElement.href = url;
    linkElement.download = `${profile.username}_contact.vcf`;
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
  };

  const getIconComponent = (iconId: string) => {
    const iconObj = AVAILABLE_ICONS.find(i => i.id === iconId);
    if (iconObj) {
      const IconComponent = iconObj.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <Link2 className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] flex flex-col justify-center items-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs text-neutral-400 font-mono tracking-widest uppercase">
          Tapping ChipNG Contact...
        </p>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="min-h-screen bg-[#07070a] px-4 flex flex-col justify-center items-center text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-amber-500/80 mb-6 shadow-xl">
          <Wifi className="w-8 h-8 transform rotate-45 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">
          User profile not found
        </h1>
        <p className="text-xs text-neutral-400 max-w-sm mt-2 leading-relaxed">
          The requested username is available to register. Tap below to reserve your ChipNG handle and claim physical card activation.
        </p>
        
        <a
          href="/"
          className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-xs text-black uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
        >
          Reserve Username Handle
        </a>
      </div>
    );
  }

  const userTheme = profile.theme;
  const primaryColor = userTheme.primaryColor || "#3b82f6";

  return (
    <div 
      className="min-h-screen flex flex-col text-white transition-colors duration-500 px-4 py-8 md:py-16 selection:bg-amber-500/30 font-sans"
      style={{ backgroundColor: userTheme.backgroundColor }}
    >
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between">
        
        {/* Core Profile Card Presentation */}
        <div className="space-y-6">
          
          {/* Main 3D Interactive Card projection wrapper */}
          <div className="w-full flex justify-center">
            <NfcCard3D
              displayName={profile.display_name || profile.username}
              bio={profile.bio || "Physical NFC business card bio representation."}
              avatarUrl={profile.avatar_url || "https://api.dicebear.com/7.x/bottts/svg"}
              theme={userTheme}
              nfcData={profile.nfc_data}
              username={profile.username}
            />
          </div>

          {/* Contact action button: VCARD generator trigger */}
          <button
            onClick={handleDownloadvCard}
            className="w-full py-4 rounded-2xl font-black text-sm text-black flex items-center justify-center space-x-2 transition-all duration-300 transform active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.05)] hover:shadow-xl"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 4px 14px 0 rgba(${parseInt(primaryColor.slice(1,3),16)}, ${parseInt(primaryColor.slice(3,5),16)}, ${parseInt(primaryColor.slice(5,7),16)}, 0.25)`
            }}
          >
            <UserPlus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>Save Contact vCard</span>
          </button>

          {/* Biography text readout (outside card for premium legibility) */}
          {profile.bio && (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Glowing Active Custom Links */}
          <div className="space-y-3 pt-3">
            {links.map((link) => {
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between text-neutral-200 transition-all duration-200 transform hover:translate-y-[-2px] hover:border-white/10"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 shrink-0" style={{ color: primaryColor }}>
                      {getIconComponent(link.icon)}
                    </div>
                    <span className="font-bold text-sm tracking-wide text-white truncate max-w-[240px]">
                      {link.title}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-500 shrink-0" />
                </a>
              );
            })}

            {links.length === 0 && (
              <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                <span className="text-xs text-neutral-500 font-mono italic">
                  This user has not linked any external connection pages yet.
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Global Footer Trademark branding */}
        <div className="text-center pt-12 opacity-40">
          <a
            href="/"
            className="inline-flex items-center space-x-1.5 focus:outline-none"
          >
            <span className="text-[9px] font-mono tracking-widest text-neutral-400 font-bold uppercase transition-all hover:text-white">
              SHAPED BY CHIPNG NFC v2
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}

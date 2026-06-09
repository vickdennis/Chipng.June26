import React, { useState, useEffect } from "react";
import { LinkItem } from "../types";
import { 
  X, 
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
  Bookmark,
  Share2
} from "lucide-react";

interface AddEditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: { title: string; url: string; icon: string; is_active: boolean }) => void;
  editingLink: LinkItem | null;
}

const AVAILABLE_ICONS = [
  { id: "twitter", name: "Twitter / X", icon: Twitter },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "github", name: "GitHub", icon: Github },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "globe", name: "Website/Portfolio", icon: Globe },
  { id: "mail", name: "Email", icon: Mail },
  { id: "phone", name: "Phone/vCard Cell", icon: Phone },
  { id: "whatsapp", name: "WhatsApp Chat", icon: MessageSquare },
  { id: "location", name: "HQ Address", icon: MapPin },
  { id: "sublink", name: "Affiliate Link", icon: Bookmark },
  { id: "generic", name: "Custom Link", icon: Link2 }
];

export default function AddEditLinkModal({
  isOpen,
  onClose,
  onSave,
  editingLink
}: AddEditLinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("generic");
  const [isActive, setIsActive] = useState(true);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (editingLink) {
      setTitle(editingLink.title);
      setUrl(editingLink.url);
      setSelectedIcon(editingLink.icon || "generic");
      setIsActive(editingLink.is_active);
    } else {
      setTitle("");
      setUrl("");
      setSelectedIcon("generic");
      setIsActive(true);
    }
    setValidationError("");
  }, [editingLink, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) {
      setValidationError("Link title is required.");
      return;
    }

    if (!url.trim()) {
      setValidationError("Destination URL is required.");
      return;
    }

    // Basic URL check helper
    let cleanUrl = url.trim();
    if (selectedIcon === "mail" && !cleanUrl.startsWith("mailto:")) {
      cleanUrl = `mailto:${cleanUrl}`;
    } else if (selectedIcon === "phone" && !cleanUrl.startsWith("tel:")) {
      cleanUrl = `tel:${cleanUrl}`;
    } else if (selectedIcon === "whatsapp" && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("http://")) {
      // Build proper whatsapp link if they just input a number
      if (/^\d+$/.test(cleanUrl)) {
        cleanUrl = `https://wa.me/${cleanUrl}`;
      } else if (!cleanUrl.startsWith("https://wa.me/")) {
        cleanUrl = `https://${cleanUrl}`;
      }
    } else if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("mailto:") && !cleanUrl.startsWith("tel:")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    onSave({
      title: title.trim(),
      url: cleanUrl,
      icon: selectedIcon,
      is_active: isActive
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-rose-500" />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            {editingLink ? "Edit Bio Connection Link" : "Add Custom Connection Link"}
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg font-medium leading-normal animate-pulse">
              {validationError}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Link Friendly Title
            </label>
            <input
              type="text"
              placeholder="e.g. My Design Portfolio, Follow us on Twitter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 text-sm text-white border border-white/10 rounded-lg px-3 py-2.5 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Destination URL / Endpoint
            </label>
            <input
              type="text"
              placeholder={
                selectedIcon === "mail" 
                  ? "e.g. hello@mybrand.co" 
                  : selectedIcon === "phone" 
                    ? "e.g. +14155552671" 
                    : "e.g. myportfolio.com, twitter.com/username"
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-black/40 text-sm text-white border border-white/10 rounded-lg px-3 py-2.5 focus:border-amber-500/50 focus:outline-none font-mono"
            />
          </div>

          {/* Icon Selector Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Select Link Visual Identity (Icon)
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
              {AVAILABLE_ICONS.map((iconInfo) => {
                const IconComponent = iconInfo.icon;
                const isSelected = selectedIcon === iconInfo.id;
                
                return (
                  <button
                    key={iconInfo.id}
                    type="button"
                    onClick={() => setSelectedIcon(iconInfo.id)}
                    className={`p-2 flex flex-col items-center justify-center rounded-lg border text-center transition-all hover:scale-105 select-none ${
                      isSelected 
                        ? "border-amber-500 bg-amber-500/10 text-white" 
                        : "border-white/5 bg-black/20 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mb-1" />
                    <span className="text-[9px] truncate max-w-full font-mono">{iconInfo.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Is Active */}
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Active Visibility</span>
              <span className="text-[10px] text-neutral-400">Toggle whether this link is rendered on your public NFC profile page</span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:bg-black peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Trigger Save */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-xs font-semibold text-black rounded-lg transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
            >
              {editingLink ? "Apply Updates" : "Add Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export { AVAILABLE_ICONS };

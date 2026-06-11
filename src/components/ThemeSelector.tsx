import React, { useState } from "react";
import { ThemeConfig, Profile } from "../types";
import { Palette, Check, LayoutGrid, Sparkles, Image as ImageIcon, Type, Diamond, Upload } from "lucide-react";

interface ThemeSelectorProps {
  theme: ThemeConfig;
  profile: Profile;
  onChange: (theme: Partial<ThemeConfig>) => void;
  onProfileChange: (updates: Partial<Profile>) => void;
  onUploadImage: (file: File, bucket: string) => Promise<string>;
}

const PRESET_COLORS = [
  { name: "Velmora Gold", primary: "#d4af37", bg: "#09090b", label: "Gold & Dark Zinc" },
  { name: "Royal Indigo", primary: "#6366f1", bg: "#0f172a", label: "Indigo & Slate Blue" },
  { name: "Neon Emerald", primary: "#10b981", bg: "#022c22", label: "Emerald & Deep Mint" },
  { name: "Cyberpunk Pink", primary: "#ec4899", bg: "#180828", label: "Hot Magenta & Deep Purple" },
  { name: "Stark Monochrome", primary: "#f4f4f5", bg: "#09090b", label: "Pure Zinc Minimalist" },
  { name: "Sunset Crimson", primary: "#f43f5e", bg: "#1e0b12", label: "Rose & Sunset Velvet" }
];

const CARD_STYLES = [
  { id: "glassmorphism", name: "Frost Glass", desc: "Translucent layout with blur glow" },
  { id: "modern", name: "Stark Matte", desc: "Minimalist bold modern card" },
  { id: "cyberpunk", name: "Chiba Punk", desc: "Interactive neon yellow terminal card" },
  { id: "neo-brutalism", name: "Brutalist", desc: "Thick lines and playful stark contrast shadow" },
  { id: "gold-foil", name: "Gold Foil", desc: "Premium textured physical metallic finish" }
];

const FONTS = [
  { id: "'Inter', sans-serif", name: "Inter", desc: "Clean & Modern" },
  { id: "'Space Grotesk', sans-serif", name: "Space Grotesk", desc: "Tech & Geometric" },
  { id: "'JetBrains Mono', monospace", name: "JetBrains Mono", desc: "Developer & Code" },
  { id: "'Playfair Display', serif", name: "Playfair Display", desc: "Editorial & Elegant" }
];

const ICON_STYLES = [
  { id: "colored", name: "Colored", desc: "Vibrant branded colors" },
  { id: "monochrome", name: "Monochrome", desc: "Minimalist matching theme" }
];

export default function ThemeSelector({ theme, profile, onChange, onProfileChange, onUploadImage }: ThemeSelectorProps) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      const url = await onUploadImage(file, 'covers');
      onProfileChange({ cover_image: url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBg(true);
      const url = await onUploadImage(file, 'backgrounds');
      onChange({ backgroundImage: url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingBg(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cover Image & Background Image */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neutral-300" />
            Cover Image
          </label>
          <div className="flex items-center gap-4">
            {profile.cover_image && (
              <img src={profile.cover_image} alt="Cover" className="w-24 h-12 object-cover rounded-md border border-white/10" />
            )}
            <label className="cursor-pointer px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md text-xs font-medium text-white transition-all flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              {uploadingCover ? "Uploading..." : "Upload Cover"}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
            </label>
            {profile.cover_image && (
              <button 
                type="button" 
                onClick={() => onProfileChange({ cover_image: null })}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
           <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neutral-300" />
            Background Image
          </label>
          <div className="flex items-center gap-4">
            {theme.backgroundImage && (
              <img src={theme.backgroundImage} alt="Background" className="w-16 h-16 object-cover rounded-md border border-white/10" />
            )}
            <label className="cursor-pointer px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md text-xs font-medium text-white transition-all flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              {uploadingBg ? "Uploading..." : "Upload Background"}
              <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} disabled={uploadingBg} />
            </label>
            {theme.backgroundImage && (
              <button 
                type="button" 
                onClick={() => onChange({ backgroundImage: undefined })}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Typography / Font Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <Type className="w-4 h-4 text-neutral-300" />
          Typography
        </label>
        <div className="grid grid-cols-2 gap-3">
          {FONTS.map(font => {
            const isSelected = theme.fontFamily === font.id || (!theme.fontFamily && font.id.includes('Inter'));
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => onChange({ fontFamily: font.id })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected ? "border-amber-500 bg-amber-500/5 shadow-md" : "border-white/5 bg-black/40 hover:bg-black/60"
                }`}
              >
                <span className={`block text-sm font-semibold ${isSelected ? 'text-amber-400' : 'text-white'}`} style={{ fontFamily: font.id }}>
                  {font.name}
                </span>
                <span className="text-[10px] text-neutral-400 mt-1 block">{font.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Icon Style Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <Diamond className="w-4 h-4 text-neutral-300" />
          Icon Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ICON_STYLES.map(style => {
            const isSelected = profile.icon_style === style.id || (!profile.icon_style && style.id === 'monochrome');
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onProfileChange({ icon_style: style.id })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected ? "border-amber-500 bg-amber-500/5 shadow-md" : "border-white/5 bg-black/40 hover:bg-black/60"
                }`}
              >
                <span className={`block text-sm font-semibold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                  {style.name}
                </span>
                <span className="text-[10px] text-neutral-400 mt-1 block">{style.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Visual Presets Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-neutral-300" />
          Aesthetic Palettes
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESET_COLORS.map((preset) => {
            const isSelected = 
              theme.primaryColor.toLowerCase() === preset.primary.toLowerCase() && 
              theme.backgroundColor.toLowerCase() === preset.bg.toLowerCase();

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange({ 
                  primaryColor: preset.primary, 
                  backgroundColor: preset.bg,
                  textColor: preset.primary === "#f4f4f5" ? "#09090b" : "#ffffff"
                })}
                className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between h-20 group hover:border-white/20 hover:scale-[1.02] ${
                  isSelected 
                    ? "border-amber-500 bg-white/5 shadow-lg" 
                    : "border-white/5 bg-black/40"
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="text-xs font-medium text-white truncate max-w-[80%]">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-black stroke-[3px]" />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/10 shrink-0" 
                    style={{ backgroundColor: preset.primary }} 
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-white/10 shrink-0" 
                    style={{ backgroundColor: preset.bg }} 
                  />
                  <span className="text-[10px] text-neutral-400 truncate">
                    {preset.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Type Customization */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-neutral-300" />
          Physical Card Material Style
        </label>
        <div className="space-y-2">
          {CARD_STYLES.map((style) => {
            const isSelected = theme.cardStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onChange({ cardStyle: style.id as ThemeConfig['cardStyle'] })}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all group ${
                  isSelected 
                    ? "border-amber-500 bg-amber-500/5 shadow-md" 
                    : "border-white/5 bg-black/40 hover:bg-black/60"
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${isSelected ? "text-amber-400" : "text-white"}`}>
                    {style.name}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {style.desc}
                  </span>
                </div>
                {isSelected && (
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Hex override */}
      <div className="pt-2 border-t border-white/5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Custom Brand Accents
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-neutral-400 font-mono">Accent Hex</span>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="w-full bg-black/40 text-xs text-white border border-white/10 rounded px-2.5 py-1.5 focus:border-amber-500/50 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 font-mono">Background Hex</span>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={theme.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="w-full bg-black/40 text-xs text-white border border-white/10 rounded px-2.5 py-1.5 focus:border-amber-500/50 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

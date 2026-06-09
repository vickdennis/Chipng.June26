import React from "react";
import { ThemeConfig } from "../types";
import { Palette, Check, LayoutGrid, Sparkles } from "lucide-react";

interface ThemeSelectorProps {
  theme: ThemeConfig;
  onChange: (theme: Partial<ThemeConfig>) => void;
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

export default function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-6">
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

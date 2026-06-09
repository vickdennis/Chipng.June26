import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { ThemeConfig, NfcData } from "../types";
import { CreditCard, Wifi, ShieldCheck, HelpCircle } from "lucide-react";

interface NfcCard3DProps {
  displayName: string;
  bio: string;
  avatarUrl: string;
  theme: ThemeConfig;
  nfcData?: NfcData;
  username: string;
}

export default function NfcCard3D({
  displayName,
  bio,
  avatarUrl,
  theme,
  nfcData,
  username
}: NfcCard3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const card = containerRef.current;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Normalize coordinates to rotate max 20 degrees
    const factorX = 20 / (box.height / 2);
    const factorY = 20 / (box.width / 2);
    
    setRotate({
      x: -y * factorX, // Tilt up-down based on Y
      y: x * factorY   // Tilt left-right based on X
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  // Get card style classes and inline gradient values
  const getCardStyle = () => {
    switch (theme.cardStyle) {
      case "gold-foil":
        return {
          cardBg: "bg-gradient-to-br from-neutral-900 via-yellow-950 to-neutral-900 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
          textHeader: "text-amber-400 font-bold font-sans",
          secondary: "text-amber-200/70",
          chipColor: "from-yellow-300 to-amber-500",
          nfcTagColor: "text-amber-400"
        };
      case "cyberpunk":
        return {
          cardBg: "bg-yellow-400 border-2 border-black shadow-[4px_4px_0_0_#000] text-black",
          textHeader: "text-black font-mono uppercase tracking-widest font-black",
          secondary: "text-neutral-800 font-mono text-xs",
          chipColor: "from-neutral-700 to-neutral-900",
          nfcTagColor: "text-black"
        };
      case "neo-brutalism":
        return {
          cardBg: "bg-white border-4 border-black shadow-[6px_6px_0_0_#000] text-black",
          textHeader: "text-black font-sans font-black tracking-tight",
          secondary: "text-neutral-700 font-sans",
          chipColor: "from-cyan-400 to-blue-500 border border-black",
          nfcTagColor: "text-cyan-500"
        };
      case "modern":
        return {
          cardBg: "bg-black/90 border border-neutral-800 shadow-2xl",
          textHeader: "text-white font-sans font-medium tracking-tight",
          secondary: "text-neutral-400 font-sans",
          chipColor: "from-neutral-400 to-neutral-600",
          nfcTagColor: "text-blue-400"
        };
      case "glassmorphism":
      default:
        return {
          cardBg: "backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(15,23,42,0.3)]",
          textHeader: "text-white font-sans font-semibold tracking-tight",
          secondary: "text-neutral-300 font-sans",
          chipColor: "from-zinc-300 to-zinc-500",
          nfcTagColor: "text-teal-400"
        };
    }
  };

  const style = getCardStyle();
  const themePrimaryColor = theme.primaryColor || "#3b82f6";

  return (
    <div 
      className="w-full flex justify-center items-center py-6"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        id="card-container-3d"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
          scale: isHovered ? 1.04 : 1
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={`relative w-80 h-48 md:w-[350px] md:h-[210px] rounded-2xl p-6 flex flex-col justify-between cursor-pointer select-none overflow-hidden ${style.cardBg}`}
      >
        {/* Shimmer overlay effect */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none transform translate-x-[-50%] animate-shimmer" />
        )}

        {/* Top bar */}
        <div className="w-full flex justify-between items-start z-10">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${style.chipColor} flex items-center justify-center relative overflow-hidden shadow-inner`}>
              {/* Chip contact grid visual lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] opacity-40">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-black/90" />
                ))}
              </div>
              <div className="w-4 h-4 rounded-sm border border-black/30 bg-cover" />
            </div>
            
            <div className="flex flex-col">
              <span className={`text-xs uppercase tracking-widest font-mono font-bold leading-none ${theme.cardStyle === 'cyberpunk' || theme.cardStyle === 'neo-brutalism' ? 'text-black' : 'text-neutral-400'}`}>
                CHIPNG
              </span>
              <span className="text-[9px] text-neutral-500 font-mono font-bold tracking-tight leading-none">
                3D TOUCH v2
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* NFC Wave Logo status */}
            <div className="flex flex-col items-end mr-1">
              <span className={`text-[8px] font-mono font-bold leading-none ${theme.cardStyle === 'cyberpunk' || theme.cardStyle === 'neo-brutalism' ? 'text-black' : 'text-neutral-500'}`}>
                {nfcData?.activationStatus === "activated" ? "ONLINE" : "OFFLINE"}
              </span>
              <span className="text-[7px] text-neutral-500 leading-none">
                {nfcData?.serialNumber ? nfcData.serialNumber : "UNBOUND"}
              </span>
            </div>
            <Wifi className={`w-5 h-5 ${style.nfcTagColor} animate-pulse transform rotate-90`} />
          </div>
        </div>

        {/* Center Name & Bio Display */}
        <div className="z-10 mt-2 mb-1 flex items-center space-x-3">
          {avatarUrl && (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              referrerPolicy="no-referrer"
              className={`w-12 h-12 rounded-full object-cover shrink-0 ${theme.cardStyle === 'neo-brutalism' ? 'border-2 border-black' : 'border border-white/20'}`}
            />
          )}
          <div className="flex flex-col min-w-0">
            <h3 className={`text-lg leading-snug truncate ${style.textHeader}`}>
              {displayName || "Your Name"}
            </h3>
            <p className={`text-xs line-clamp-2 leading-normal mt-0.5 ${style.secondary}`}>
              {bio || "Enter public biography..."}
            </p>
          </div>
        </div>

        {/* Bottom Bar: Brand details, QR code placeholder and NFC Tag info */}
        <div className="w-full flex justify-between items-end z-10 pt-1 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[8px] tracking-wider font-mono text-neutral-500 uppercase">
              URL ID
            </span>
            <span className={`text-xs font-mono font-semibold truncate max-w-[160px] ${theme.cardStyle === 'cyberpunk' || theme.cardStyle === 'neo-brutalism' ? 'text-black font-bold' : 'text-white'}`}>
              chipng.co/{username || "username"}
            </span>
          </div>

          {/* Hologram or dynamic color stamp */}
          <div 
            className="w-12 h-6 rounded flex items-center justify-center opacity-85 text-[8px] font-mono text-white/90 text-center uppercase tracking-tighter"
            style={{ 
              background: `linear-gradient(135deg, ${themePrimaryColor} 0%, #a855f7 50%, #ec4899 100%)`,
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            ACTIVE
          </div>
        </div>
      </motion.div>
    </div>
  );
}

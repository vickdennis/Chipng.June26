import React, { useState } from "react";
import { NfcData } from "../types";
import { Wifi, Radio, Shield, Copy, Check, ArrowRight, Zap } from "lucide-react";

interface NfcTagSettingsProps {
  nfcData: NfcData;
  onChange: (nfcData: Partial<NfcData>) => void;
  publicUrl: string;
}

export default function NfcTagSettings({
  nfcData,
  onChange,
  publicUrl
}: NfcTagSettingsProps) {
  const [bindInput, setBindInput] = useState(nfcData.serialNumber || "");
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindInput.trim()) {
      onChange({ serialNumber: null, activationStatus: "pending" });
      setSuccessMsg("Tag unbound successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      return;
    }

    const cleanBind = bindInput.trim().toUpperCase();
    onChange({
      serialNumber: cleanBind,
      activationStatus: "activated"
    });
    setSuccessMsg(`Physical Tag ID ${cleanBind} activated and mapped!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleSimulateActivation = () => {
    const randomSerial = "NFC-" + Math.floor(1000 + Math.random() * 9000) + "-CHIP";
    setBindInput(randomSerial);
    onChange({
      serialNumber: randomSerial,
      activationStatus: "activated"
    });
    setSuccessMsg(`Instant simulation: Tag ID ${randomSerial} mapped!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-start gap-4">
        <div className={`p-3 rounded-full shrink-0 ${
          nfcData.activationStatus === "activated" 
            ? "bg-emerald-500/10 text-emerald-400" 
            : "bg-amber-500/10 text-amber-500"
        }`}>
          <Radio className={`w-5 h-5 ${nfcData.activationStatus === "activated" ? "animate-pulse" : ""}`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">NFC Chip Integration Status</span>
            <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
              nfcData.activationStatus === "activated" 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-amber-500/20 text-amber-500"
            }`}>
              {nfcData.activationStatus}
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            {nfcData.activationStatus === "activated"
              ? `Your custom profile is mapped to physical card serial tag: ${nfcData.serialNumber}. Tap your phone against the card to view.`
              : "No physical NFC smart metal card is paired. Enter a serial ID or test program manually below."}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-medium">
          {successMsg}
        </div>
      )}

      {/* Manual NFC Binding Form */}
      <form onSubmit={handleBind} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Pair Physical NFC Metal Tag
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. NFC-8821-X9R or NTAG215-ID"
              value={bindInput}
              onChange={(e) => setBindInput(e.target.value)}
              className="flex-1 bg-black/40 text-sm text-white border border-white/10 rounded-lg px-3 py-2 focus:border-amber-500/50 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-white/5 rounded-lg transition-all"
            >
              Update Map
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            Leave blank and update to unbind custom tag serial numbers.
          </p>
        </div>
      </form>

      {/* Test simulation button for developers review workflow */}
      <div className="p-4 bg-gradient-to-r from-amber-500/5 via-neutral-900 to-neutral-950 border border-amber-500/10 rounded-xl space-y-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white">Evaluation NFC Simulator</span>
          <span className="text-[10px] text-neutral-400">Quickly simulation tag pairing for reviewing the 3D smart layout</span>
        </div>
        <button
          type="button"
          onClick={handleSimulateActivation}
          className="w-full py-2 bg-amber-500 hover:bg-amber-600 font-semibold text-xs text-black rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.15)]"
        >
          <Wifi className="w-4 h-4" />
          <span>Simulate Instant NFC Card Tap</span>
        </button>
      </div>

      {/* NFC Tools tutorial */}
      <div className="border-t border-white/5 pt-4 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          Physical NFC Tag Programming Reference
        </label>
        
        <p className="text-xs text-neutral-400 leading-normal">
          ChipNG smart visual profiles can be linked to ANY standard rewriteable NFC tag (NTAG213, NTAG215, NTAG216) or smart card custom chip. Follow these instructions:
        </p>

        <ol className="text-xs text-neutral-400 space-y-2 list-decimal list-inside pl-1">
          <li>
            <span className="font-semibold text-white">Copy your NFC Target link:</span>
            <div className="flex items-center gap-2 mt-1.5 pl-4">
              <span className="font-mono bg-black/60 text-[10px] px-2 py-1 border border-white/5 rounded select-all break-all text-neutral-300">
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-1 text-neutral-400 hover:text-white bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-all shrink-0"
                title="Copy public bio URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </li>
          <li>
            Download <strong className="text-white font-medium">NFC Tools</strong> app from App Store (iOS) or Google Play Store (Android).
          </li>
          <li>
            Open the application, click <strong className="text-white font-medium">Write</strong>, select <strong className="text-white font-medium">Add a record</strong>, then pick <strong className="text-white font-medium">URL/URI</strong>.
          </li>
          <li>
            Paste your copied ChipNG target URL and select Ok.
          </li>
          <li>
            Tap <strong className="text-white font-medium">Write / Write URL</strong> and place your cold physical metal card against the mobile antenna.
          </li>
        </ol>
      </div>
    </div>
  );
}

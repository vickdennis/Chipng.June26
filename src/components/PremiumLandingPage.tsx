import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Smartphone, Layers, Cpu, CheckCircle2, Star, Zap, Globe, Shield, ArrowRight, Menu, X, Play } from 'lucide-react';

interface PremiumLandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onSandbox: () => void;
  onAdmin?: () => void;
}

// 3D Card Component with tilt effect
const Floating3DCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Calculate rotation (-15 to 15 degrees)
    setRotateY((x / (rect.width / 2)) * 15);
    setRotateX(-(y / (rect.height / 2)) * 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div 
      className="perspective-1000 w-full max-w-sm mx-auto relative z-10"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ 
          rotateX, 
          rotateY, 
          y: [0, -15, 0] // Floating effect
        }}
        transition={{ 
          rotateX: { type: 'spring', stiffness: 300, damping: 30, mass: 0.5 },
          rotateY: { type: 'spring', stiffness: 300, damping: 30, mass: 0.5 },
          y: { repeat: Infinity, duration: 4, ease: 'easeInOut' }
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full aspect-[1/1.5] rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/20 shadow-2xl relative overflow-hidden group cursor-pointer"
      >
        {/* Card Glossy Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -translate-x-full group-hover:translate-x-full" style={{ transition: 'all 1s ease' }} />
        
        {/* Card Content */}
        <div className="absolute inset-0 p-8 flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl ml-2 mt-2 shadow-lg">
              CN
            </div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono mt-2 mr-2">
              Tap Enabled
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="w-16 h-1 bg-amber-500 rounded-full mb-4 opacity-80" />
            <h3 className="text-2xl font-black text-white tracking-tight">Victor Dennis</h3>
            <p className="text-sm text-zinc-400 font-medium">Founder @ ChipNG</p>
            <div className="flex gap-3 pt-4">
               <span className="w-8 h-8 rounded-full bg-zinc-800 flex flex-col justify-center items-center text-xs text-white">𝕏</span>
               <span className="w-8 h-8 rounded-full bg-zinc-800 flex flex-col justify-center items-center text-xs text-white">in</span>
               <span className="w-8 h-8 rounded-full bg-zinc-800 flex flex-col justify-center items-center text-xs text-indigo-400">🔗</span>
            </div>
          </div>
        </div>

        {/* Floating elements attached to card */}
        <motion.div 
           className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/20 rounded-full blur-xl"
           style={{ transform: 'translateZ(-10px)' }}
        />
        <motion.div 
           className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"
           style={{ transform: 'translateZ(-20px)' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default function PremiumLandingPage({ onLogin, onRegister, onSandbox, onAdmin }: PremiumLandingPageProps) {
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const fastParallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const fadeOut = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-indigo-500/30">
      
      {/* Abstract Background Elements with Parallax */}
      <motion.div style={{ y: parallaxY }} className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] right-[-20%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[140px]" />
      </motion.div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0 mask-image:linear-gradient(to_bottom,white,transparent)"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white text-black font-black text-xs flex items-center justify-center rounded-lg">CN</div>
             <span className="font-bold text-xl tracking-tight hidden sm:block">ChipNG</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button onClick={onLogin} className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Log In</button>
            <button onClick={onRegister} className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">Get Your Card</button>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu drop */}
        {mobileMenuOpen && (
           <motion.div 
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             className="md:hidden bg-zinc-950 border-b border-white/10 p-6 flex flex-col space-y-4"
           >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 font-medium">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 font-medium">Pricing</a>
              <hr className="border-white/10 my-2" />
              <button onClick={() => { setMobileMenuOpen(false); onLogin(); }} className="text-left font-medium text-white">Log In</button>
              <button onClick={() => { setMobileMenuOpen(false); onRegister(); }} className="bg-white text-black px-4 py-2 rounded-lg font-medium text-center">Get Your Card</button>
           </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24 relative z-10">
             
             {/* Left Text content */}
             <div className="flex-1 space-y-8 text-center md:text-left">
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.8, delay: 0.1 }}
                   className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400"
                >
                   <span className="flex h-2 w-2 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                   V2 Premium Architecture Live
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]"
                >
                  The Digital Identity <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">Forged in Metal.</span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto md:mx-0 leading-relaxed font-light"
                >
                  Ditch paper business cards. Share your contact info, social links, and portfolio with a single highly-styled contactless tap using our premium 3D smart profile system.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start"
                >
                  <button onClick={onRegister} className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform flex items-center justify-center gap-2">
                    Claim Your Profile <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={onSandbox} className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-bold transition-colors flex items-center justify-center gap-2 group">
                    <Play className="w-4 h-4 group-hover:text-amber-400 transition-colors" /> Interactive Sandbox
                  </button>
                </motion.div>
             </div>

             {/* Right Floating 3D Card */}
             <div className="flex-1 w-full flex justify-center perspective-1000">
               <Floating3DCard />
             </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          style={{ opacity: fadeOut }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500 hidden md:flex"
        >
          <span className="text-xs uppercase tracking-widest font-mono">Scroll to Explore</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-px h-12 bg-gradient-to-b from-zinc-500 to-transparent"
          />
        </motion.div>
      </section>

      {/* Features Section with Scroll Parallax */}
      <section id="features" className="py-32 px-6 relative z-10 bg-black">
         <div className="max-w-7xl mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8 }}
               className="text-center max-w-2xl mx-auto mb-20 space-y-4"
            >
               <h2 className="text-3xl md:text-5xl font-black tracking-tight">Engineering Brilliance</h2>
               <p className="text-zinc-400 text-lg">Every micron of our digital profiles and physical systems is obsessively crafted to make your introduction unforgettable.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { icon: Smartphone, title: 'NFC Contactless', desc: 'Tap against any modern smartphone to instantly transfer your profile without apps.', color: 'text-amber-400', bg: 'bg-amber-400/10' },
                 { icon: Layers, title: 'Immersive 3D', desc: 'Our WebGL-inspired React 3D engine ensures your digital presence floats, tilts, and breathes.', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                 { icon: Zap, title: 'Lightning Fast', desc: 'Cached edge networks serve your profile globally in under 200ms. Speed is everything.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                 { icon: Shield, title: 'Bank-grade Security', desc: 'Your connection data is hashed safely. Strict RLS policies protect your private information.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                 { icon: Globe, title: 'Custom URLs', desc: 'Secure chipng.com/username links that you own. Redirect domains effortlessly.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
                 { icon: Cpu, title: 'vCard Extraction', desc: 'Prospects can persist your full contact payload instantly inside native iOS/Android phonebooks.', color: 'text-rose-400', bg: 'bg-rose-400/10' }
               ].map((feature, i) => (
                 <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-3xl bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 border border-white/5`}>
                       <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed text-sm">{feature.desc}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Pricing Section (Minimalist) */}
      <section id="pricing" className="py-32 px-6 relative z-10 border-t border-white/5 overflow-hidden">
        <motion.div style={{ y: fastParallaxY }} className="absolute -top-[50%] -right-[20%] w-[100%] h-[100%] bg-indigo-500/5 rounded-full blur-[200px] pointer-events-none z-0" />
        
        <div className="max-w-5xl mx-auto relative z-10">
           <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black">Simple, Premium Pricing</h2>
              <p className="text-zinc-400">One physical card. Unlimited digital potential.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
             {/* Digital Tier */}
             <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-10 rounded-[2.5rem] bg-zinc-900/50 backdrop-blur-xl border border-white/10 flex flex-col"
             >
                <div className="space-y-2 mb-8">
                  <h3 className="text-2xl font-bold">Digital Profile</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">Free</span>
                    <span className="text-zinc-500 font-mono text-sm">/ forever</span>
                  </div>
                </div>
                <ul className="space-y-4 flex-1 mb-8">
                  {['Custom chipng.com URL', 'Unlimited link generation', '3D Interactive Mobile Card', 'vCard Downloads', 'Standard Support'].map((feat, i) => (
                    <li key={i} className="flex gap-3 text-zinc-300">
                      <CheckCircle2 className="w-5 h-5 text-zinc-500 shrink-0" />
                      <span className="text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={onRegister} className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">Start Free</button>
             </motion.div>

             {/* Pro Tier (Highlighted) */}
             <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-10 rounded-[2.5rem] bg-gradient-to-b from-indigo-600/20 to-zinc-900 backdrop-blur-xl border border-indigo-500/30 flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.15)]"
             >
                <div className="absolute top-0 right-0 p-4">
                   <span className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</span>
                </div>
                <div className="space-y-2 mb-8">
                  <h3 className="text-2xl font-bold">Premium Metal + Platform</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">$49</span>
                    <span className="text-zinc-500 font-mono text-sm">/ one-time</span>
                  </div>
                </div>
                <ul className="space-y-4 flex-1 mb-8">
                  {['Everything in Digital', 'Custom Laser-engraved Metal Card', 'NFC Hardware Pairing', 'Priority FedEx Shipping', 'Analytics Dashboard', 'No Monthly Fees'].map((feat, i) => (
                    <li key={i} className="flex gap-3 text-white">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={onRegister} className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-colors shadow-lg shadow-indigo-500/25">Order Premium Card</button>
             </motion.div>
           </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center space-y-12">
            <h2 className="text-3xl font-black">Trusted by Professionals</h2>
            <div className="flex flex-wrap justify-center gap-8">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl w-full max-w-sm text-left">
                     <div className="flex gap-1 text-amber-500 mb-4">
                       <Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" />
                     </div>
                     <p className="text-zinc-400 italic text-sm mb-6">"This completely revolutionized how I network. The heavy metal card paired with the insanely smooth 3D digital profile leaves people stunned every time."</p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full border border-white/10" />
                        <div>
                           <div className="font-bold text-sm">Executive Member</div>
                           <div className="text-[10px] text-zinc-500 font-mono">Verified Card Owner</div>
                        </div>
                     </div>
                  </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-800 text-zinc-400 font-black text-xs flex items-center justify-center rounded-lg">CN</div>
             <span className="font-bold text-lg tracking-tight text-white/50">ChipNG</span>
           </div>
           
           <div className="flex gap-6 text-sm text-zinc-500 font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); onAdmin?.(); }}>Admin Console</a>
           </div>

           <div className="text-xs text-zinc-600 font-mono tracking-widest uppercase">
              © {new Date().getFullYear()} ChipNG Technologies
           </div>
        </div>
      </footer>
    </div>
  );
}

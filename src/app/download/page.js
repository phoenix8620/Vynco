"use client";

import { motion } from 'framer-motion';
import { Smartphone, Download, Star, CheckCircle, SmartphoneNfc } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-sapphire-950 flex md:items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-neon/[0.05] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sapphire-700/[0.1] rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10 glass-panel p-8 md:p-10 rounded-[2.5rem] glow-border shadow-2xl mt-12 md:mt-0 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-dark to-cyan-neon rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,229,255,0.3)]">
          <SmartphoneNfc className="w-10 h-10 text-sapphire-900" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Get the <span className="text-gradient">Vynco App</span>
        </h1>
        <p className="text-sapphire-300 text-sm md:text-base mb-8 max-w-sm mx-auto">
          You've successfully used our web portal. Download the full Android application to manage your professional identity, view offline cards, and chat in realtime.
        </p>

        <div className="bg-sapphire-900/40 border border-sapphire-700 rounded-2xl p-5 mb-8 text-left space-y-3">
          {[
             "Native offline QR rendering",
             "Realtime chat and messaging alerts",
             "Deep integrations with NFC cards",
             "Network graph access"
          ].map((feat, i) => (
             <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-neon flex-shrink-0" />
                <span className="text-sapphire-200 text-sm">{feat}</span>
             </div>
          ))}
        </div>

        <div className="space-y-4">
          <button className="w-full py-4 px-6 bg-white hover:bg-sapphire-50 text-sapphire-950 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl">
            <Download className="w-5 h-5" />
            Download for Android
          </button>
          
          <button className="w-full py-4 px-6 bg-transparent border border-sapphire-600 text-sapphire-400 font-medium rounded-2xl transition-all cursor-not-allowed opacity-60 flex items-center justify-center gap-3">
            <Smartphone className="w-5 h-5" />
            iOS Beta Coming Soon
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1 text-cyan-neon">
          <Star className="w-4 h-4 fill-cyan-neon" />
          <Star className="w-4 h-4 fill-cyan-neon" />
          <Star className="w-4 h-4 fill-cyan-neon" />
          <Star className="w-4 h-4 fill-cyan-neon" />
          <Star className="w-4 h-4 fill-cyan-neon" />
          <span className="ml-2 text-sapphire-400 text-xs font-medium uppercase tracking-wider">5.0 Ranked App</span>
        </div>
      </motion.div>
    </div>
  );
}

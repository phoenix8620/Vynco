"use client";

import React from 'react';
import { Plus } from 'lucide-react';

export const FAB = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all duration-300 z-50 active:scale-95"
      aria-label="Create new post"
    >
      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
};

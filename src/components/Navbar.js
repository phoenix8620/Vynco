"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Zap, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open (disabled for dropdown style)
  useEffect(() => {
    // if (mobileOpen) {
    //   document.body.style.overflow = 'hidden';
    // } else {
    //   document.body.style.overflow = '';
    // }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const publicLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How it Works', href: '/#how-it-works' },
  ];

  const authLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Connections', href: '/connections' },
    { label: 'Messages', href: '/messages' },
    { label: 'Settings', href: '/settings' },
  ];

  const links = user ? authLinks : publicLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-sapphire-950 border-b border-white/[0.06] shadow-xl">
      <div className="section-container">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-neon to-cyan-dark flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white">Vynco</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${pathname === link.href
                  ? 'text-cyan-neon'
                  : 'text-sapphire-400 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && !user && (
              <>
                <Link
                  href="/auth"
                  className="text-sm font-medium text-sapphire-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
            {!loading && user && (
              <Link
                href="/dashboard"
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 -mr-2 text-white bg-sapphire-900/80 border border-cyan-neon/30 rounded-xl shadow-[0_0_10px_rgba(0,229,255,0.1)] transition-all active:scale-95"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown — dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 sm:top-16 left-0 right-0 bg-sapphire-950 border-b border-white/[0.06] z-40 animate-slide-down shadow-2xl">
          <div className="section-container py-6 flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-base font-medium py-3 px-4 rounded-xl transition-colors ${pathname === link.href
                  ? 'text-cyan-neon bg-cyan-neon/[0.06]'
                  : 'text-sapphire-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              {!loading && !user && (
                <>
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 px-5 text-base font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 px-5 mt-3 text-base font-medium text-sapphire-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
              {!loading && user && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-3 px-5 text-base font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

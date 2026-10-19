import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function TopNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleDiscordLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
    const DISCORD_REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI;
    
    if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
      console.error('Discord is not configured yet. Add VITE_DISCORD_CLIENT_ID and VITE_DISCORD_REDIRECT_URI to .env');
      return;
    }
    sessionStorage.setItem('discord_oauth_return_to', `${window.location.pathname}${window.location.search}`);

    const url = new URL('https://discord.com/api/oauth2/authorize');
    url.searchParams.append('client_id', DISCORD_CLIENT_ID);
    url.searchParams.append('redirect_uri', DISCORD_REDIRECT_URI);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'identify email');
    url.searchParams.append('prompt', 'consent');
    window.location.href = url.toString();
  };

  const navLinks = [
    { label: 'Home', href: '/home-design' },
    { label: 'Members', href: '/members-design' },
    { label: 'Events', href: '/events-design' },
    { label: 'Projects', href: '/projects' },
    { label: 'About', href: '/about' },
    { label: 'Login', href: '/login-design' },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-30 border-b border-white/15 bg-black/55 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <a href="/home-design" className="flex items-center">
            <img
              src="/navicon.png"
              alt="Aura-7F"
              className="h-9 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
            />
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((l) => {
              const isActive = location.pathname.startsWith(l.href);
              
              if (l.label === 'Login') {
                return (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={handleDiscordLogin}
                    className="rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors bg-[#f4d03f] text-black hover:bg-[#e0be36] cursor-pointer"
                  >
                    {l.label}
                  </a>
                );
              }

              return (
                <a
                  key={l.label}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors ${
                    isActive
                      ? 'bg-white/15 text-[#f4d03f]'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {l.label}
                </a>
              );
            })}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[61px] z-20 border-b border-white/15 bg-black/95 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col px-4 py-4 space-y-2">
            {navLinks.map((l) => {
              const isActive = location.pathname.startsWith(l.href);
              
              if (l.label === 'Login') {
                return (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleDiscordLogin(e);
                    }}
                    className="block rounded-lg px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors bg-[#f4d03f] text-black hover:bg-[#e0be36] cursor-pointer"
                  >
                    {l.label}
                  </a>
                );
              }

              return (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors ${
                    isActive
                      ? 'bg-white/15 text-[#f4d03f]'
                      : 'text-white/75 hover:bg-white/10 hover:text-[#f4d03f]'
                  }`}
                >
                  {l.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

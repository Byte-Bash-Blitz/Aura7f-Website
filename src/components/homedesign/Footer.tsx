import React from 'react';

const MailIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.8c0-1.43.23-2.83.68-4.15a1.5 1.5 0 01.48-.64C5.6 6.15 8.5 5.4 12 5.4s6.4.75 8.64 2.61c.26.2.42.5.48.83.45 1.32.68 2.72.68 4.15s-.23 2.83-.68 4.15a1.5 1.5 0 01-.48.64C18.4 19.29 15.5 20.05 12 20.05s-6.4-.76-8.64-2.62a1.5 1.5 0 01-.48-.64 14.7 14.7 0 01-.68-4.15M12 15.6a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zm5.85-8.4a.9.9 0 100-1.8.9.9 0 000 1.8z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.54 5.34A16.5 16.5 0 0015.44 4l-.3.5c1.6.4 2.33.9 3.2 1.6a11.6 11.6 0 00-9.1 0c.85-.7 1.6-1.24 3.2-1.6L12.1 4a16.5 16.5 0 00-4.1 1.34C5.35 9.26 4.6 13 5 16.68A16.6 16.6 0 0010.17 19l.8-1.3c-.7-.25-1.35-.6-1.95-1l.5-.35a11.8 11.8 0 009.9 0l.5.35c-.6.4-1.28.75-1.95 1l.8 1.3a16.55 16.55 0 005.18-2.32c.45-4.25-.6-7.9-3.51-11.34zM9.6 14.6c-.95 0-1.72-.87-1.72-1.93 0-1.07.76-1.94 1.72-1.94.97 0 1.74.88 1.72 1.94 0 1.06-.76 1.93-1.72 1.93zm4.8 0c-.95 0-1.72-.87-1.72-1.93 0-1.07.76-1.94 1.72-1.94.97 0 1.74.88 1.72 1.94 0 1.06-.75 1.93-1.72 1.93z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.5 6.9a3 3 0 00-2.12-2.13C19.5 4.25 12 4.25 12 4.25s-7.5 0-9.38.52A3 3 0 00.5 6.9C0 8.8 0 12 0 12s0 3.2.5 5.1a3 3 0 002.12 2.13c1.88.52 9.38.52 9.38.52s7.5 0 9.38-.52a3 3 0 002.12-2.13C24 15.2 24 12 24 12s0-3.2-.5-5.1zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* brand */}
          <div>
            <div className="flex items-center gap-2">
              <img src="/navicon.png" alt="Aura-7F" className="h-7 w-auto object-contain" />
              <span className="text-xs font-black uppercase tracking-widest text-white/70">
                Aura-7F
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              BashClan 1 of Byte Bash Blitz. Towers, walls and war-banners — home of the Bashers.
            </p>
          </div>

          {/* pages */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f4d03f]">
              Pages
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
              {[
                { label: 'Home', href: '/home' },
                { label: 'About', href: '/about' },
                { label: 'Members', href: '/members-design' },
                { label: 'Events', href: '/events' },
                { label: 'Projects', href: '/projects' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'Milestones', href: '/milestones' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-xs font-bold text-white/55 transition-colors hover:text-[#f4d03f]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* connect */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f4d03f]">
              Connect
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: 'Mail', href: 'mailto:aura7f.bytebashblitz@gmail.com', icon: MailIcon },
                { label: 'Instagram', href: 'https://www.instagram.com/aura.7f', icon: InstagramIcon },
                { label: 'Discord', href: 'https://discord.gg/TpEDzzBPf', icon: DiscordIcon },
                { label: 'YouTube', href: 'https://www.youtube.com/@Aura7F-bashers', icon: YoutubeIcon },
              ].map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-white/55 transition-colors hover:text-[#f4d03f]"
                  >
                    <s.icon />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* join */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f4d03f]">
              Join the clan
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              Wars, hackathons and live quizzes. Bring your build to the gates.
            </p>
            <a
              href="/events"
              className="mt-4 inline-flex rounded-lg bg-[#f4d03f] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-colors hover:bg-[#e0be36]"
            >
              View Quests
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-5 sm:flex-row">
          <p className="text-[10px] text-white/35">© 2025 Aura-7F. All rights reserved.</p>
          <p className="text-[10px] text-white/25">BashClan 1 · Byte Bash Blitz</p>
        </div>
      </div>
    </footer>
  );
}

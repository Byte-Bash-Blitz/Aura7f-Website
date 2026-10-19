import React from 'react';
import { Crown, Shield, Users, Swords } from 'lucide-react';
import { avatarFor, displayName } from './useMembersData';

/* ------------------------------------------------------------------ */
/* Warrior panel — compact medieval clan-roster profile: small square  */
/* portrait in a stone-and-metal frame, bronze/gold borders, name +    */
/* role + existing details beneath the avatar.                         */
/* ------------------------------------------------------------------ */

function WarriorPanel({
  member,
  rank,
  variant,
}: {
  member: any;
  rank: number;
  variant: 'captain' | 'member' | 'legacy';
}) {
  const isCaptain = variant === 'captain';
  const role = member.role || (variant === 'legacy' ? 'Legacy Basher' : 'member');

  return (
    <article
      className={`group relative flex flex-col items-center overflow-hidden rounded-xl border-2 bg-gradient-to-b p-3 text-center shadow-[0_6px_18px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-1 ${
        isCaptain
          ? 'border-[#e8c96a] from-[#4a3a1c] via-[#33270f] to-[#241a08] shadow-[0_0_28px_rgba(232,201,106,0.22)] hover:shadow-[0_0_40px_rgba(232,201,106,0.35)]'
          : 'border-[#6e5636]/70 from-[#3d4046] via-[#2b2e33] to-[#1d1f23] hover:border-[#e8c96a]/60 hover:shadow-[0_0_28px_rgba(232,201,106,0.18)]'
      }`}
    >
      {/* stone-block texture */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 2px, transparent 2px 26px), repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 34px)',
        }}
      />
      {/* carved top highlight */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/50 to-transparent" />
      {/* faint shield watermark */}
      <Shield aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 text-white/[0.05]" />

      {/* rank plaque */}
      <span className="absolute left-2 top-2 z-10 rounded-md border border-black/60 bg-[#1d130a]/85 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-[#e8c96a] ring-1 ring-[#e8c96a]/30">
        {String(rank).padStart(2, '0')}
      </span>
      {/* crown for captains */}
      {isCaptain && (
        <span className="absolute right-2 top-2 z-10 rounded-full border border-black/60 bg-gradient-to-b from-[#fff3c4] to-[#e8c96a] p-1 text-[#4a2c0a] shadow-md">
          <Crown size={12} fill="currentColor" />
        </span>
      )}

      {/* small square portrait in stone-and-metal frame */}
      <div className="relative mt-2">
        <div
          className={`rounded-lg p-[3px] transition-shadow duration-300 ${
            isCaptain
              ? 'bg-gradient-to-b from-[#fff3c4] via-[#e8c96a] to-[#7e5a00] shadow-[0_0_20px_rgba(232,201,106,0.4)]'
              : 'bg-gradient-to-b from-[#d9c08a] via-[#8a6a3b] to-[#3d2a12] shadow-[0_3px_10px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_18px_rgba(232,201,106,0.3)]'
          }`}
        >
          <div className="rounded-[6px] bg-[#14100a] p-[2px] ring-1 ring-black/60">
            <img
              src={avatarFor(member)}
              alt={displayName(member)}
              loading="lazy"
              className="h-16 w-16 rounded-[4px] object-cover sm:h-20 sm:w-20"
            />
          </div>
        </div>
      </div>

      {/* name beneath the avatar */}
      <h3 className="relative mt-2 w-full truncate text-[13px] font-black uppercase tracking-wider text-amber-50 transition-colors duration-200 group-hover:text-[#ffe87a]">
        {displayName(member)}
      </h3>
      {/* role */}
      <p className="relative mt-0.5 w-full truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[#e8c96a]">
        {role}
      </p>
      {/* existing details: username + clan status */}
      <p className="relative mt-1 flex w-full items-center justify-center gap-1.5 truncate text-[10px] text-white/40">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${member.is_clan_member ? 'bg-emerald-400' : 'bg-slate-400'}`}
        />
        <span className="truncate">
          @{member.username || 'unknown'} · {member.is_clan_member ? 'Clan member' : 'Guest'}
        </span>
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading — gold icon box + white title + count, same voice   */
/* ------------------------------------------------------------------ */

function SectionHeading({
  icon,
  title,
  subtitle,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#f4d03f]/30 bg-[#f4d03f]/10 text-[#f4d03f]">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-black uppercase tracking-wide text-white drop-shadow-md sm:text-2xl">
            {title}
          </h2>
          <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            {subtitle}
          </p>
        </div>
        <span className="rounded-full border border-white/15 bg-black/40 px-3 py-0.5 text-xs font-black tabular-nums text-[#f4d03f]">
          {count}
        </span>
      </div>
      <div className="mt-3 h-[2px] rounded-full bg-gradient-to-r from-[#f4d03f]/60 via-white/10 to-transparent" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats strip — dark glass with gold counts, real data only           */
/* ------------------------------------------------------------------ */

function StatPlaques({
  total,
  captains,
  members,
  legacy,
}: {
  total: number;
  captains: number;
  members: number;
  legacy: number;
}) {
  const stats = [
    { label: 'Clan Strength', value: total, icon: <Users size={16} /> },
    { label: 'Captains', value: captains, icon: <Crown size={16} /> },
    { label: 'Members', value: members, icon: <Swords size={16} /> },
    { label: 'Legacy', value: legacy, icon: <Shield size={16} /> },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl bg-black/55 px-4 py-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.35)] ring-1 ring-white/15 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:ring-[#f4d03f]/40"
        >
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#f4d03f]/30 bg-[#f4d03f]/10 text-[#f4d03f]">
            {s.icon}
          </span>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#f4d03f] drop-shadow-lg">
            {s.value}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col items-center rounded-xl border-2 border-[#6e5636]/40 bg-black/40 p-3"
        >
          <div className="h-16 w-16 rounded-lg bg-white/10 sm:h-20 sm:w-20" />
          <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
          <div className="mt-1.5 h-2 w-1/2 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Board — same section structure as the Events page EventsBoard:      */
/* scenic photo + overlay, max-w-7xl content, centered header zone,    */
/* responsive card grid, same loading/empty states.                    */
/* ------------------------------------------------------------------ */

export default function MembersBoard({
  captains,
  rest,
  legacy,
  total,
  loading,
  error,
}: {
  captains: any[];
  rest: any[];
  legacy: any[];
  total: number;
  loading: boolean;
  error: string | null;
}) {
  const statusText = loading
    ? 'Summoning the clan…'
    : error
      ? error
      : total === 0
        ? 'No members found.'
        : `${total} member${total === 1 ? '' : 's'} strong`;

  return (
    <section className="relative z-10 w-full">
      {/* same scenic backdrop treatment as the Events board section */}
      <div className="absolute inset-0">
        <img src="/events-deisgn.png" alt="Aura-7F clan hall" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-10">
        {/* header zone — centered title block in the Events voice */}
        <div className="mb-9 flex flex-col items-center gap-4 pt-12 text-center">
          <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-white">
            Clan Roster · BashClan 1
          </span>
          <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-lg sm:text-4xl">
            Clan <span className="text-[#f4d03f]">Members</span>
          </h1>
          <div className="h-[2px] w-24 rounded-full bg-[#f4d03f]/60" />
          <p className="max-w-xl text-sm leading-relaxed text-white/60">
            Towers, walls and war-banners — every Basher standing guard,
            forged from the live clan records.
          </p>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
            {statusText}
          </p>
        </div>

        {/* statistics plaques — real counts, never hardcoded */}
        <div className="mx-auto mb-12 max-w-5xl">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-black/55 ring-1 ring-white/15" />
              ))}
            </div>
          ) : error ? null : (
            <StatPlaques
              total={total}
              captains={captains.length}
              members={rest.length}
              legacy={legacy.length}
            />
          )}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-2xl bg-black/40 py-20 text-center ring-1 ring-white/10 backdrop-blur-md">
            <p className="mx-auto max-w-md break-words px-4 text-sm font-bold text-white/40">{error}</p>
          </div>
        ) : total === 0 ? (
          <div className="rounded-2xl bg-black/40 py-20 text-center ring-1 ring-white/10 backdrop-blur-md">
            <p className="text-sm font-bold text-white/40">No members found.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {captains.length > 0 && (
              <section aria-label="Captain Bashers">
                <SectionHeading
                  icon={<Crown size={18} />}
                  title="Captain Bashers"
                  subtitle="War command · first into battle"
                  count={captains.length}
                />
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {captains.map((m: any, i: number) => (
                    <div
                      key={m.id || m.username}
                      className="w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)]"
                    >
                      <WarriorPanel
                        member={m}
                        rank={i + 1}
                        variant="captain"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section aria-label="Members">
                <SectionHeading
                  icon={<Swords size={18} />}
                  title="Members"
                  subtitle="Active Bashers holding the walls"
                  count={rest.length}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {rest.map((m: any, i: number) => (
                    <WarriorPanel
                      key={m.id || m.username}
                      member={m}
                      rank={captains.length + i + 1}
                      variant="member"
                    />
                  ))}
                </div>
              </section>
            )}

            {legacy.length > 0 && (
              <section aria-label="Legacy Bashers">
                <SectionHeading
                  icon={<Shield size={18} />}
                  title="Legacy Bashers"
                  subtitle="Honoured veterans of the clan"
                  count={legacy.length}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {legacy.map((m: any, i: number) => (
                    <WarriorPanel
                      key={m.id || m.username}
                      member={m}
                      rank={captains.length + rest.length + i + 1}
                      variant="legacy"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

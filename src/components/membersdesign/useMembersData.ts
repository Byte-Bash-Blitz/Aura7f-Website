import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Same source as Admin Dashboard + existing Members page (public.users table,
// read-only). Role values match the Admin Dashboard role picker
// (case-insensitive): captains are stored as 'captain bash', bottom group as
// 'Legacy Basher'.
const normRole = (role: any) => (role || '').trim().toLowerCase();

export const isCaptainBash = (m: any) => {
  const r = normRole(m?.role);
  return r === 'captain bash' || r === 'captain basher';
};

export const isLegacyBash = (m: any) => normRole(m?.role) === 'legacy basher';

export const avatarFor = (m: any) =>
  m.avatar_url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(m.external_name || m.username || 'Member')}&background=0f0518&color=ffd700&size=256`;

export const displayName = (m: any) => m.external_name || m.username || 'Unknown member';

export default function useMembersData() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async function fetchMembers() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, external_name, avatar_url, role, is_clan_member')
          .order('username', { ascending: true });
        if (error) throw error;
        setMembers(data || []);
      } catch (err: any) {
        setError(err?.message || 'Could not load members.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const captains = members.filter(isCaptainBash);
  const legacy = members.filter(isLegacyBash);
  const rest = members.filter((m) => !isCaptainBash(m) && !isLegacyBash(m));

  return { members, captains, rest, legacy, loading, error };
}

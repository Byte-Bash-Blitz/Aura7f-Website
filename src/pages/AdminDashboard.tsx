import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateSlots, getAvailableSlots, cancelSlot } from '../lib/slotApi';
import { formatTime12h } from '../lib/utils';
import { exportSlotsToExcel, exportSlotsToPDF } from '../lib/exportUtils';
import EditRegistrationModal from '../components/admin/EditRegistrationModal';
import { Shield, Users, Calendar, LayoutGrid, Search, Sparkles, Plus, X, Trash2, ChevronRight, Activity, CircleDot, UserCheck, CalendarDays, Layers, Pencil, ShieldCheck, UserPlus, Save, AlertCircle, CheckCircle2, FileSpreadsheet, FileText, Edit3, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../components/AdminNav';

type TabType = 'users' | 'members' | 'events' | 'projects';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [usersList, setUsersList] = useState<any[]>([]);
    const [eventsList, setEventsList] = useState<any[]>([]);

    // Slot Form State
    const [slotForm, setSlotForm] = useState({
        eventId: '',
        dayNumber: 1,
        date: '',
        startTime: '10:00',
        endTime: '17:00',
        duration: 15,
        capacity: 1
    });

    const [newEventForm, setNewEventForm] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        tag: 'Guild',
        custom_category: 'project_showcase',
        has_slots: true,
        status: 'upcoming'
    });
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [createMsg, setCreateMsg] = useState('');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');

    // Admin Slot Viewer State
    const [viewingEvent, setViewingEvent] = useState<any | null>(null);
    const [viewingDay, setViewingDay] = useState(1);
    const [adminSlots, setAdminSlots] = useState<any[]>([]);
    const [adminSlotsLoading, setAdminSlotsLoading] = useState(false);

    // Slot Inspection (Registrations CRUD)
    const [inspectingSlot, setInspectingSlot] = useState<any | null>(null);
    const [slotRegistrations, setSlotRegistrations] = useState<any[]>([]);
    const [inspectingLoading, setInspectingLoading] = useState(false);
    const [editingRegistrationModalData, setEditingRegistrationModalData] = useState<any | null>(null);

    // Members management state
    const [membersList, setMembersList] = useState<any[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any | null>(null);
    const [memberForm, setMemberForm] = useState({
        discord_user_id: '',
        username: '',
        external_name: '',
        avatar_url: '',
        role: 'member',
        is_clan_member: true
    });
    const [memberMsg, setMemberMsg] = useState('');
    const [savingMember, setSavingMember] = useState(false);
    const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (viewingEvent) {
            fetchAdminSlots(viewingEvent.id, viewingDay);
        }
    }, [viewingEvent, viewingDay]);

    const fetchAdminSlots = async (eventId: string, day: number) => {
        setAdminSlotsLoading(true);
        try {
            const slots = await getAvailableSlots(eventId, day);
            setAdminSlots(slots);
        } catch (err) {
            console.error('Error fetching admin slots:', err);
        } finally {
            setAdminSlotsLoading(false);
        }
    };

    // Load specialized registrations for a specific slot when clicked
    useEffect(() => {
        if (inspectingSlot) {
            loadSlotRegistrations(inspectingSlot.id);
        }
    }, [inspectingSlot]);

    const loadSlotRegistrations = async (slotId: string) => {
        setInspectingLoading(true);
        try {
            const { data, error } = await supabase
                .from('event_slot_registrations')
                .select(`
                    id,
                    event_id,
                    user_email,
                    event_registrations (
                        id, name, email, registration_no, department, year, section, clan, project_title, project_category, project_description
                    )
                `)
                .eq('slot_id', slotId);

            if (data && !error) setSlotRegistrations(data);
        } catch (e) {
            console.error(e);
        } finally {
            setInspectingLoading(false);
        }
    };

    const handleRemoveRegistration = async (esrItem: any) => {
        if (!window.confirm(`Are you certain you want to banish ${esrItem.event_registrations?.name}'s booking? This will free up the slot immediately.`)) return;

        try {
            // First destroy the master level registration record, which CASCADES to event_slot_registrations
            await supabase.from('event_registrations').delete().eq('id', esrItem.event_registrations.id);

            // Reload UI state silently without closing popup
            await loadSlotRegistrations(inspectingSlot.id);
            if (viewingEvent) {
                await fetchAdminSlots(viewingEvent.id, viewingDay);
            }
        } catch (err) {
            console.error("Failed to delete booking:", err);
            alert("Error: Database resisted deletion.");
        }
    };

    useEffect(() => {
        const discordUserStr = sessionStorage.getItem('discordUser');
        if (!discordUserStr) {
            navigate('/newhome');
            return;
        }

        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'events') {
            fetchEvents();
        } else if (activeTab === 'members') {
            fetchMembers();
        } else {
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
        }
    }, [navigate, activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*').order('username', { ascending: true });
            if (!error && data) {
                setUsersList(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
            if (!error && data) {
                setEventsList(data);
                if (data.length > 0 && !slotForm.eventId) {
                    setSlotForm(s => ({ ...s, eventId: data[0].id }));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSlots = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slotForm.eventId || !slotForm.date) {
            setMessage('Error: Please select an event and provide a date.');
            return;
        }

        setGenerating(true);
        setMessage('');
        try {
            await generateSlots(
                slotForm.eventId,
                Number(slotForm.dayNumber),
                slotForm.date,
                slotForm.startTime,
                slotForm.endTime,
                Number(slotForm.duration),
                Number(slotForm.capacity)
            );
            setMessage('Success! Event slots generated flawlessly. They are now live on the database.');
        } catch (err: any) {
            setMessage('Error: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingEvent(true);
        setCreateMsg('');

        try {
            if (editingEventId) {
                // Update existing event
                const { error } = await supabase.from('events').update({
                    title: newEventForm.title,
                    description: newEventForm.description,
                    date: newEventForm.date,
                    time: newEventForm.time,
                    location: newEventForm.location,
                    tag: newEventForm.tag,
                    custom_category: newEventForm.custom_category,
                    has_slots: newEventForm.has_slots,
                    status: newEventForm.status
                }).eq('id', editingEventId);

                if (error) throw error;
                setCreateMsg('Successfully updated the Event data!');
            } else {
                // Summon new event
                const { error } = await supabase.from('events').insert({
                    title: newEventForm.title,
                    description: newEventForm.description,
                    date: newEventForm.date,
                    time: newEventForm.time,
                    location: newEventForm.location,
                    tag: newEventForm.tag,
                    custom_category: newEventForm.custom_category,
                    has_slots: newEventForm.has_slots,
                    status: newEventForm.status,
                    attendees: '0'
                });

                if (error) throw error;
                setCreateMsg('Successfully summoned new Event into the database!');
            }

            setNewEventForm({ title: '', description: '', date: '', time: '', location: '', tag: 'Guild', custom_category: 'project_showcase', has_slots: true, status: 'upcoming' });
            setEditingEventId(null);
            fetchEvents();
        } catch (err: any) {
            setCreateMsg('Error: ' + err.message);
        } finally {
            setCreatingEvent(false);
        }
    };

    const handleEditClick = (ev: any) => {
        setEditingEventId(ev.id);
        setNewEventForm({
            title: ev.title || '',
            description: ev.description || '',
            date: ev.date || '',
            time: ev.time || '',
            location: ev.location || '',
            tag: ev.tag || 'Guild',
            custom_category: ev.custom_category || 'project_showcase',
            has_slots: !!ev.has_slots,
            status: ev.status || 'upcoming'
        });
        setCreateMsg('');

        // Scroll to form smoothly
        const element = document.getElementById("event-summon-form");
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteEvent = async (evId: string, evTitle: string) => {
        if (!window.confirm(`Are you certain you want to permanently erase the event "${evTitle}"? This will DESTROY all slots and ALL user registrations associated with it CASCADING through the database.`)) return;

        try {
            const { error } = await supabase.from('events').delete().eq('id', evId);
            if (error) throw error;
            fetchEvents();
        } catch (err: any) {
            alert('Failed to erase event: ' + err.message);
        }
    };

    const tabs = [
        { id: 'users', label: 'User Roles', icon: <Users size={18} /> },
        { id: 'members', label: 'Members', icon: <Shield size={18} /> },
        { id: 'events', label: 'Events', icon: <Calendar size={18} /> },
        { id: 'projects', label: 'Projects', icon: <LayoutGrid size={18} /> },
    ] as const;

    // Derived stats
    const totalUsers = usersList.length;
    const totalEvents = eventsList.length;
    const liveEvents = eventsList.filter(e => e.status === 'live').length;
    const slotEvents = eventsList.filter(e => e.has_slots).length;

    const stats = [
        { label: 'Total Users', value: totalUsers, icon: <UserCheck size={20} />, accent: 'indigo' },
        { label: 'Total Events', value: totalEvents, icon: <CalendarDays size={20} />, accent: 'sky' },
        { label: 'Live Events', value: liveEvents, icon: <Activity size={20} />, accent: 'emerald' },
        { label: 'Slot Events', value: slotEvents, icon: <Layers size={20} />, accent: 'amber' },
    ];

    const accentMap: Record<string, string> = {
        indigo: 'from-indigo-500/20 to-indigo-500/0 text-indigo-400 ring-indigo-500/20',
        sky: 'from-sky-500/20 to-sky-500/0 text-sky-400 ring-sky-500/20',
        emerald: 'from-emerald-500/20 to-emerald-500/0 text-emerald-400 ring-emerald-500/20',
        amber: 'from-amber-500/20 to-amber-500/0 text-amber-400 ring-amber-500/20',
    };

    // Members CRUD
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*').order('username', { ascending: true });
            if (!error && data) {
                setMembersList(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openMemberModal = (member?: any) => {
        if (member) {
            setEditingMember(member);
            setMemberForm({
                discord_user_id: member.discord_user_id || '',
                username: member.username || '',
                external_name: member.external_name || '',
                avatar_url: member.avatar_url || '',
                role: member.role || 'member',
                is_clan_member: !!member.is_clan_member
            });
        } else {
            setEditingMember(null);
            setMemberForm({ discord_user_id: '', username: '', external_name: '', avatar_url: '', role: 'member', is_clan_member: true });
        }
        setMemberMsg('');
        setMemberModalOpen(true);
    };

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingMember(true);
        setMemberMsg('');
        try {
            if (editingMember) {
                const { error } = await supabase.from('users').update({
                    username: memberForm.username,
                    external_name: memberForm.external_name || null,
                    avatar_url: memberForm.avatar_url || null,
                    role: memberForm.role,
                    is_clan_member: memberForm.is_clan_member
                }).eq('id', editingMember.id);
                if (error) throw error;
                setMemberMsg('Member updated successfully.');
            } else {
                const { error } = await supabase.from('users').insert({
                    discord_user_id: memberForm.discord_user_id,
                    username: memberForm.username,
                    external_name: memberForm.external_name || null,
                    avatar_url: memberForm.avatar_url || null,
                    role: memberForm.role,
                    is_clan_member: memberForm.is_clan_member
                });
                if (error) throw error;
                setMemberMsg('Member created successfully.');
            }
            await fetchMembers();
            setTimeout(() => setMemberModalOpen(false), 700);
        } catch (err: any) {
            setMemberMsg('Error: ' + err.message);
        } finally {
            setSavingMember(false);
        }
    };

    const handleDeleteMember = async () => {
        if (!deleteMemberId) return;
        try {
            const { error } = await supabase.from('users').delete().eq('id', deleteMemberId);
            if (error) throw error;
            setDeleteMemberId(null);
            fetchMembers();
        } catch (err: any) {
            alert('Failed to delete member: ' + err.message);
        }
    };

    const filteredMembers = membersList.filter(m => {
        const q = memberSearch.trim().toLowerCase();
        if (!q) return true;
        return (m.username || '').toLowerCase().includes(q)
            || (m.external_name || '').toLowerCase().includes(q)
            || (m.discord_user_id || '').toLowerCase().includes(q)
            || (m.role || '').toLowerCase().includes(q);
    });

    return (
        <div className="min-h-screen w-full bg-[#0a0e1a] text-slate-200 font-sans antialiased selection:bg-indigo-500/30 selection:text-white">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0b1220] to-[#0a0e1a]"></div>
                <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[140px]"></div>
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            </div>

            <div className="relative z-10 flex min-h-screen">
                {/* Sidebar */}
                <AdminNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Main content */}
                <main className="flex-1 min-w-0 lg:pl-[268px]">
                    <div className="px-5 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-[1400px] mx-auto">

                        {/* Page header */}
                        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wide ring-1 ring-indigo-500/20 mb-3">
                                    <Sparkles size={14} />
                                    <span>Administration</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                    Command Center
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">
                                    Manage users, events, and slot bookings from a single console.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-400">
                                    <CircleDot size={14} className="text-emerald-400" />
                                    <span className="text-xs font-medium">System Online</span>
                                </div>
                                <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                                    <span className="text-sm font-medium text-slate-200">Admin</span>
                                </div>
                            </div>
                        </header>

                        {/* Stat cards */}
                        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {stats.map((s) => (
                                <div key={s.label} className={`relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 ring-1 ${accentMap[s.accent].split(' ').slice(2).join(' ')}`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${accentMap[s.accent].split(' ').slice(0, 2).join(' ')} opacity-60`}></div>
                                    <div className="relative z-10">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.04] ring-1 ${accentMap[s.accent].split(' ').slice(2).join(' ')} mb-3`}>
                                            <span className={accentMap[s.accent].split(' ')[1]}>{s.icon}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white tabular-nums">{s.value}</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </section>

                        {/* Tab navigation */}
                        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl mb-6 overflow-x-auto">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                            isActive
                                                ? 'bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content card */}
                        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-xl">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-7 py-5 border-b border-white/[0.06]">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-indigo-400">{tabs.find(t => t.id === activeTab)?.icon}</span>
                                    <h2 className="text-base font-semibold text-white">
                                        {tabs.find(t => t.id === activeTab)?.label}
                                    </h2>
                                </div>
                                <div className="relative">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full sm:w-64 bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5 sm:p-7">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <p className="text-slate-500 text-sm mt-4">Loading data…</p>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {activeTab === 'users' && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/[0.08]">
                                                            <th className="px-4 py-3 font-medium">User</th>
                                                            <th className="px-4 py-3 font-medium">Discord ID</th>
                                                            <th className="px-4 py-3 font-medium">Role</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/[0.05]">
                                                        {usersList.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={3} className="text-center py-16 text-slate-500">No users found in database.</td>
                                                            </tr>
                                                        ) : (
                                                            usersList.map((usr) => (
                                                                <tr key={usr.id} className="hover:bg-white/[0.03] transition-colors group">
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <img src={usr.avatar_url || `https://ui-avatars.com/api/?name=${usr.username}`} alt="avatar" className="w-9 h-9 rounded-full bg-white/[0.06] ring-1 ring-white/10 group-hover:ring-indigo-500/40 transition-colors" />
                                                                            <span className="font-semibold text-white">{usr.username}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{usr.discord_user_id || 'N/A'}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${usr.role === 'captain bash' || usr.role === 'admin' ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20' : 'bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/20'}`}>
                                                                            {usr.role || 'Guest'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {activeTab === 'members' && (
                                            <div className="space-y-5">
                                                {/* Toolbar */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="relative w-full sm:max-w-xs">
                                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search members..."
                                                            value={memberSearch}
                                                            onChange={e => setMemberSearch(e.target.value)}
                                                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 transition-colors"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => openMemberModal()}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
                                                    >
                                                        <UserPlus size={16} /> Add Member
                                                    </button>
                                                </div>

                                                {/* Table */}
                                                <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                                                    <table className="w-full text-left text-sm">
                                                        <thead>
                                                            <tr className="text-slate-400 text-xs uppercase tracking-wider bg-white/[0.03]">
                                                                <th className="px-4 py-3 font-medium">Member</th>
                                                                <th className="px-4 py-3 font-medium">Discord ID</th>
                                                                <th className="px-4 py-3 font-medium">Role</th>
                                                                <th className="px-4 py-3 font-medium">Clan</th>
                                                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/[0.05]">
                                                            {filteredMembers.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="text-center py-12 text-slate-500">No members found.</td>
                                                                </tr>
                                                            ) : (
                                                                filteredMembers.map((m) => (
                                                                    <tr key={m.id} className="hover:bg-white/[0.03] transition-colors group">
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.username}`} alt="" className="w-9 h-9 rounded-full bg-white/[0.06] ring-1 ring-white/10 group-hover:ring-indigo-500/40 transition-colors" />
                                                                                <div>
                                                                                    <p className="font-semibold text-white leading-tight">{m.external_name || m.username}</p>
                                                                                    <p className="text-xs text-slate-500">@{m.username}</p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.discord_user_id || 'N/A'}</td>
                                                                        <td className="px-4 py-3">
                                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${m.role === 'captain bash' || m.role === 'admin' ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20' : 'bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/20'}`}>
                                                                                {m.role || 'Guest'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            {m.is_clan_member
                                                                                ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"><ShieldCheck size={12} /> Active</span>
                                                                                : <span className="text-slate-500 text-xs">Guest</span>}
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button onClick={() => openMemberModal(m)} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-indigo-300 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all" title="Edit">
                                                                                    <Pencil size={15} />
                                                                                </button>
                                                                                <button onClick={() => setDeleteMemberId(m.id)} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-red-400/80 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/40 transition-all" title="Delete">
                                                                                    <Trash2 size={15} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'events' && (
                                            <div className="space-y-6">
                                                {/* Events list */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Active Events</h3>
                                                        <span className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full ring-1 ring-indigo-500/20">
                                                            {eventsList.length} Total
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {eventsList.slice(0, 6).map(event => (
                                                            <div key={event.id} className="group p-5 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate pr-2">{event.title}</h4>
                                                                    <span className={`shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${event.status === 'live' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20'}`}>{event.status}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-mono mb-4">{event.date} • {event.has_slots ? 'Slots Enabled' : 'Standard Registration'}</p>

                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleDeleteEvent(event.id, event.title)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 text-xs font-semibold transition-all">
                                                                        Delete
                                                                    </button>
                                                                    <button onClick={() => handleEditClick(event)} className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-indigo-300 text-xs font-semibold transition-all">
                                                                        Edit
                                                                    </button>
                                                                    {event.has_slots && (
                                                                        <button onClick={() => setViewingEvent(event)} className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-lg text-amber-300 text-xs font-semibold transition-all">
                                                                            Slots
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {eventsList.length > 6 && (
                                                            <div className="p-5 flex flex-col justify-center items-center border border-dashed border-white/[0.08] rounded-xl text-slate-500 text-sm hover:bg-white/[0.03] cursor-pointer transition-colors">
                                                                View all {eventsList.length} events
                                                                <ChevronRight size={16} className="mt-1" />
                                                            </div>
                                                        )}
                                                        {eventsList.length === 0 && (
                                                            <div className="col-span-full py-12 text-center text-slate-500 text-sm">No events created yet.</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Create Event */}
                                                <div id="event-summon-form" className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-6 md:p-7">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                            <Calendar size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-semibold text-white">
                                                                {editingEventId ? 'Edit Event' : 'Create New Event'}
                                                            </h3>
                                                            <p className="text-xs text-slate-500">
                                                                {editingEventId ? 'Update the selected event details.' : 'Fill in the details to publish a new event.'}
                                                            </p>
                                                        </div>
                                                        {editingEventId && (
                                                            <button
                                                                onClick={() => { setEditingEventId(null); setNewEventForm({ title: '', description: '', date: '', time: '', location: '', tag: 'Guild', custom_category: 'project_showcase', has_slots: true, status: 'upcoming' }); }}
                                                                className="ml-auto text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>

                                                    <form onSubmit={handleCreateEvent} className="space-y-5 font-sans">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            <div className="md:col-span-2 space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Event Title</label>
                                                                <input required type="text" value={newEventForm.title} onChange={e => setNewEventForm({ ...newEventForm, title: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-colors" placeholder="e.g. Project Showcase 2024" />
                                                            </div>

                                                            <div className="md:col-span-2 space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Description</label>
                                                                <textarea required value={newEventForm.description} onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })} rows={3} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-colors resize-none" placeholder="Describe the event..."></textarea>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date</label>
                                                                <input required type="date" value={newEventForm.date} onChange={e => setNewEventForm({ ...newEventForm, date: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-colors [color-scheme:dark]" />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Start Time</label>
                                                                <input required type="time" value={newEventForm.time} onChange={e => setNewEventForm({ ...newEventForm, time: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-colors [color-scheme:dark]" />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Location</label>
                                                                <input required type="text" value={newEventForm.location} onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-colors" placeholder="e.g. Area 51" />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Category</label>
                                                                <select value={newEventForm.custom_category} onChange={e => setNewEventForm({ ...newEventForm, custom_category: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-colors">
                                                                    <option value="project_showcase">Project Showcase</option>
                                                                    <option value="weekly_bash">Weekly Bash</option>
                                                                    <option value="generic">Generic Realm</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <label className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
                                                            <input type="checkbox" checked={newEventForm.has_slots} onChange={e => setNewEventForm({ ...newEventForm, has_slots: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                                                            <span className="text-sm font-medium text-slate-200">Enable time slot bookings for this event</span>
                                                        </label>

                                                        {createMsg && (
                                                            <div className={`p-3.5 rounded-lg border text-sm font-medium ${createMsg.includes('Success') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                                                                {createMsg}
                                                            </div>
                                                        )}

                                                        <button type="submit" disabled={creatingEvent} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                            {creatingEvent ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                                                            {creatingEvent ? 'Saving…' : (editingEventId ? 'Update Event' : 'Create Event')}
                                                        </button>
                                                    </form>
                                                </div>

                                                {/* Slot Generator */}
                                                <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-6 md:p-7">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center text-amber-400">
                                                            <Sparkles size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-semibold text-white">Generate Event Slots</h3>
                                                            <p className="text-xs text-slate-500">Automatically forge time slots for bookings.</p>
                                                        </div>
                                                    </div>

                                                    <form onSubmit={handleGenerateSlots} className="space-y-5">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            <div className="md:col-span-2 space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Select Event</label>
                                                                <select
                                                                    value={slotForm.eventId}
                                                                    onChange={e => setSlotForm({ ...slotForm, eventId: e.target.value })}
                                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 focus:bg-white/[0.06] outline-none transition-colors"
                                                                >
                                                                    <option value="" disabled>-- Select an Event --</option>
                                                                    {eventsList.map(ev => (
                                                                        <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Day Number</label>
                                                                <input
                                                                    type="number" min={1} max={10} value={slotForm.dayNumber}
                                                                    onChange={e => setSlotForm({ ...slotForm, dayNumber: Number(e.target.value) })}
                                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 focus:bg-white/[0.06] outline-none transition-colors"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date</label>
                                                                <input
                                                                    type="date" value={slotForm.date}
                                                                    onChange={e => setSlotForm({ ...slotForm, date: e.target.value })}
                                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 focus:bg-white/[0.06] outline-none transition-colors [color-scheme:dark]"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Start Time</label>
                                                                <input
                                                                    type="time" value={slotForm.startTime}
                                                                    onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })}
                                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 focus:bg-white/[0.06] outline-none transition-colors [color-scheme:dark]"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">End Time</label>
                                                                <input
                                                                    type="time" value={slotForm.endTime}
                                                                    onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })}
                                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 focus:bg-white/[0.06] outline-none transition-colors [color-scheme:dark]"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Interval (Mins)</label>
                                                                <input
                                                                    type="number" step={5} min={5} value={slotForm.duration}
                                                                    onChange={e => setSlotForm({ ...slotForm, duration: Number(e.target.value) })}
                                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 focus:bg-white/[0.06] outline-none transition-colors"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Capacity / Slot</label>
                                                                <input
                                                                    type="number" min={1} value={slotForm.capacity}
                                                                    onChange={e => setSlotForm({ ...slotForm, capacity: Number(e.target.value) })}
                                                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white focus:border-amber-500/50 focus:bg-white/[0.06] outline-none transition-colors"
                                                                />
                                                            </div>
                                                        </div>

                                                        {message && (
                                                            <div className={`p-3.5 rounded-lg border text-sm font-medium ${message.includes('Success') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                                                                {message}
                                                            </div>
                                                        )}

                                                        <button
                                                            type="submit"
                                                            disabled={generating}
                                                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-amber-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {generating ? (
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <Plus size={16} />
                                                            )}
                                                            {generating ? 'Generating…' : 'Generate Slots'}
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'projects' && (
                                            <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-white/[0.08] rounded-xl bg-white/[0.02]">
                                                <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center text-slate-500 mb-4">
                                                    <LayoutGrid size={26} />
                                                </div>
                                                <h3 className="text-base font-semibold text-slate-200">Projects</h3>
                                                <p className="text-sm text-slate-500 mt-1.5 text-center max-w-sm">Project uploads and approvals are currently restricted.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Admin Slot Viewer Modal */}
            {viewingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingEvent(null)}></div>
                    <div className="relative z-10 bg-[#0d1322] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-3xl shadow-2xl">
                        <button onClick={() => setViewingEvent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                            <X size={22} />
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pr-8">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-0.5">Slot Overview: {viewingEvent.title}</h2>
                                <p className="text-xs text-slate-400">Review, export, and manage time slot bookings.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => exportSlotsToExcel(viewingEvent.title, adminSlots, viewingDay)}
                                    disabled={adminSlots.length === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all disabled:opacity-50"
                                    title="Export to Excel Spreadsheet (.xlsx)"
                                >
                                    <FileSpreadsheet size={14} /> Export Excel
                                </button>
                                <button
                                    onClick={() => exportSlotsToPDF(viewingEvent.title, adminSlots, viewingDay)}
                                    disabled={adminSlots.length === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold transition-all disabled:opacity-50"
                                    title="Export to PDF Document (.pdf)"
                                >
                                    <FileText size={14} /> Export PDF
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mb-5 border-b border-white/[0.08] pb-4">
                            <div className="flex gap-2">
                                {[1, 2, 3].map(d => (
                                    <button type="button" key={d} onClick={() => setViewingDay(d)} className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${viewingDay === d ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:border-amber-500/30'}`}>Day {d}</button>
                                ))}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                                Total: {adminSlots.length} Slots
                            </span>
                        </div>

                        {adminSlotsLoading ? (
                            <div className="p-10 flex justify-center items-center text-amber-400 text-sm">
                                <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mr-3"></div> Loading slots...
                            </div>
                        ) : adminSlots.length === 0 ? (
                            <div className="p-6 bg-red-500/10 rounded-xl border border-red-500/20 text-red-300 text-center">
                                <p className="font-medium">No slots forged for Day {viewingDay} yet.</p>
                                <p className="text-xs text-red-300/70 mt-1.5">Use the "Generate Event Slots" tool to create them.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                                {adminSlots.map(slot => {
                                    const booked = slot.capacity - slot.spots_remaining;
                                    const isFull = slot.spots_remaining === 0;
                                    const slotRegs = slot.registrations || [];

                                    return (
                                        <div
                                            key={slot.id}
                                            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                                                isFull ? 'bg-red-500/10 border-red-500/30' : booked > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.04] border-white/[0.08]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between w-full mb-2">
                                                    <span className={`font-mono text-sm font-bold ${isFull ? 'text-red-400' : 'text-slate-200'}`}>
                                                        {formatTime12h(slot.start_time)}
                                                    </span>
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                                        isFull ? 'bg-red-500/20 text-red-300' : booked > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/10 text-emerald-400'
                                                    }`}>
                                                        {booked} / {slot.capacity}
                                                    </span>
                                                </div>

                                                {/* Filled User Name Display */}
                                                <div className="my-2 min-h-[2rem]">
                                                    {slotRegs.length === 0 ? (
                                                        <p className="text-[11px] text-slate-500 italic">Unbooked slot</p>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {slotRegs.map((sr: any) => {
                                                                const details = sr.event_registrations || sr;
                                                                const name = details?.name || sr.user_email || 'Filled User';
                                                                return (
                                                                    <div key={sr.id} className="flex items-center justify-between gap-1 bg-white/[0.06] border border-white/[0.08] px-2 py-1 rounded text-xs text-amber-200 font-medium truncate" title={name}>
                                                                        <div className="flex items-center gap-1.5 truncate">
                                                                            <UserCheck size={13} className="text-amber-400 shrink-0" />
                                                                            <span className="truncate">{name}</span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingRegistrationModalData(details || sr);
                                                                            }}
                                                                            className="p-0.5 text-slate-400 hover:text-amber-300 transition-colors shrink-0"
                                                                            title="Edit filled user data"
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setInspectingSlot(slot)}
                                                className="w-full mt-2 text-xs font-semibold py-1.5 px-2 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <span>View Details</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Inspecting Exact Slot & Registrations */}
            {inspectingSlot && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setInspectingSlot(null)}></div>
                    <div className="relative z-10 bg-[#0d1322] border border-emerald-500/20 rounded-2xl p-6 md:p-8 w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl">
                        <button onClick={() => setInspectingSlot(null)} className="absolute top-4 right-4 text-slate-400 hover:text-emerald-400 transition-colors">
                            <X size={22} />
                        </button>

                        <div className="flex items-center justify-between gap-3 mb-6 border-b border-white/[0.08] pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Slot: {formatTime12h(inspectingSlot.start_time)}</h2>
                                    <p className="text-slate-400 text-sm">Total Capacity: {inspectingSlot.capacity}</p>
                                </div>
                            </div>
                        </div>

                        {inspectingLoading ? (
                            <div className="p-12 text-center text-emerald-400 border border-dashed border-emerald-500/20 rounded-xl bg-white/[0.02]">
                                <span className="animate-pulse">Accessing records...</span>
                            </div>
                        ) : slotRegistrations.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 border border-dashed border-white/[0.08] rounded-xl bg-white/[0.02]">
                                No bookings detected in this time block.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {slotRegistrations.map((esr, idx) => {
                                    const details = esr.event_registrations;
                                    return (
                                        <div key={esr.id} className="relative bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-emerald-500/30 transition-colors border-l-4 border-l-emerald-500">

                                            {/* Top Banner / Actions */}
                                            <div className="flex justify-between items-start mb-4 border-b border-white/[0.06] pb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-semibold text-white">{details?.name || 'Unknown'}</h4>
                                                        <p className="text-xs text-slate-400 font-mono">{esr.user_email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingRegistrationModalData(details || esr)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                                                        title="Edit User Filled Data"
                                                    >
                                                        <Pencil size={14} />
                                                        <span>Edit Option</span>
                                                    </button>
                                                    <button onClick={() => handleRemoveRegistration(esr)} className="p-1.5 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/40 rounded-lg transition-all" title="Remove Record">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Project Showcase Details Map if exists */}
                                            {details?.project_title ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-3">
                                                    <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                                                        <p className="text-emerald-400/70 text-[10px] uppercase font-semibold tracking-wider">Project Title</p>
                                                        <p className="text-slate-200 font-medium">{details.project_title} <span className="text-slate-500 text-xs">({details.project_category})</span></p>
                                                    </div>
                                                    <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                                                        <p className="text-emerald-400/70 text-[10px] uppercase font-semibold tracking-wider">Academic Vector</p>
                                                        <p className="text-slate-200">{details.department} • Year {details.year} {details.section}</p>
                                                    </div>
                                                    <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                                                        <p className="text-emerald-400/70 text-[10px] uppercase font-semibold tracking-wider">Reg No.</p>
                                                        <p className="text-amber-300 font-mono tracking-wider">{details.registration_no}</p>
                                                    </div>
                                                    {details.clan && (
                                                        <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                                                            <p className="text-emerald-400/70 text-[10px] uppercase font-semibold tracking-wider">Clan Banner</p>
                                                            <p className="text-amber-300">{details.clan}</p>
                                                        </div>
                                                    )}
                                                    <div className="md:col-span-2 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                                                        <p className="text-emerald-400/70 text-[10px] uppercase font-semibold tracking-wider mb-1.5">Description</p>
                                                        <p className="text-slate-400 italic text-xs leading-relaxed">{details.project_description}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-500 italic mt-2 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">Standard Registration (No additional project data).</div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Member Create/Edit Modal */}
            {memberModalOpen && (
                <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMemberModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-lg bg-[#0d1322] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                            <h3 className="text-lg font-semibold text-white">{editingMember ? 'Edit Member' : 'Add Member'}</h3>
                            <button onClick={() => setMemberModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveMember} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {!editingMember && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Discord User ID</label>
                                    <input required type="text" value={memberForm.discord_user_id} onChange={e => setMemberForm({ ...memberForm, discord_user_id: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none transition-colors" placeholder="e.g. 123456789012345678" />
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Username</label>
                                    <input required type="text" value={memberForm.username} onChange={e => setMemberForm({ ...memberForm, username: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none transition-colors" placeholder="username" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Display Name</label>
                                    <input type="text" value={memberForm.external_name} onChange={e => setMemberForm({ ...memberForm, external_name: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none transition-colors" placeholder="Display Name" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Avatar URL</label>
                                <input type="text" value={memberForm.avatar_url} onChange={e => setMemberForm({ ...memberForm, avatar_url: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none transition-colors" placeholder="https://..." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Role</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {['admin', 'captain bash', 'moderator', 'member', 'Guest'].map(r => {
                                        const selected = memberForm.role === r;
                                        return (
                                            <button
                                                type="button"
                                                key={r}
                                                onClick={() => setMemberForm({ ...memberForm, role: r })}
                                                className={`px-3 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all border ${
                                                    selected
                                                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 ring-1 ring-indigo-500/30'
                                                        : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-slate-200 hover:bg-white/[0.07]'
                                                }`}
                                            >
                                                {r}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <label className="flex items-center gap-3 p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
                                <input type="checkbox" checked={memberForm.is_clan_member} onChange={e => setMemberForm({ ...memberForm, is_clan_member: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                                <span className="text-sm font-medium text-slate-200">Active clan member</span>
                            </label>

                            {memberMsg && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${memberMsg.includes('success') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
                                    {memberMsg.includes('success') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    {memberMsg}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setMemberModalOpen(false)} className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] text-sm font-medium transition-colors">Cancel</button>
                                <button type="submit" disabled={savingMember} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-60">
                                    {savingMember ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                                    {savingMember ? 'Saving…' : (editingMember ? 'Update Member' : 'Create Member')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Member Confirmation */}
            {deleteMemberId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteMemberId(null)}></div>
                    <div className="relative z-10 w-full max-w-sm bg-[#0d1322] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 ring-1 ring-red-500/30 flex items-center justify-center text-red-400">
                                <AlertCircle size={20} />
                            </div>
                            <h3 className="text-base font-semibold text-white">Delete Member</h3>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">Are you sure you want to permanently remove this member? This action cannot be undone.</p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => setDeleteMemberId(null)} className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] text-sm font-medium transition-colors">Cancel</button>
                            <button onClick={handleDeleteMember} className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Registration Modal */}
            <EditRegistrationModal
                isOpen={!!editingRegistrationModalData}
                registration={editingRegistrationModalData}
                onClose={() => setEditingRegistrationModalData(null)}
                onSaved={() => {
                    if (inspectingSlot) {
                        loadSlotRegistrations(inspectingSlot.id);
                    }
                    if (viewingEvent) {
                        fetchAdminSlots(viewingEvent.id, viewingDay);
                    }
                }}
            />
        </div>
    );
}

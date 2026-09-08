import React, { useEffect, useState } from 'react';
import { supabase, Event } from '../lib/supabase';
import { getAvailableSlots, bookSlot } from '../lib/slotApi';
import { formatTime12h } from '../lib/utils';
import { getGoogleSheetsConfig, sendDataToGoogleSheetWebhook } from '../lib/googleSheetsApi';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Calendar as CalIcon, Shield, ArrowLeft } from 'lucide-react';
import FantasyNavbar from '../components/FantasyNavbar';

export default function Registration() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    const [bookingDay, setBookingDay] = useState(1);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    
    const [bookingForm, setBookingForm] = useState({ 
        name: '', email: '', slotId: '',
        registration_no: '', department: '', year: '', section: '',
        clan: '', project_title: '', project_category: '', project_description: ''
    });
    const [bookingState, setBookingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [bookingMsg, setBookingMsg] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;
            try {
                const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single();
                if (data && !error) setSelectedEvent(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    // Effect to fetch slots when day changes
    useEffect(() => {
        if (selectedEvent && selectedEvent.has_slots) {
            fetchSlots(selectedEvent.id, bookingDay);
        }
    }, [selectedEvent, bookingDay]);

    const fetchSlots = async (eventId: string, day: number) => {
        setSlotsLoading(true);
        try {
            const slots = await getAvailableSlots(eventId, day);
            setAvailableSlots(slots);
        } catch (err: any) {
            console.error(err);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedEvent || !bookingForm.name || !bookingForm.email) return;
        if (selectedEvent.has_slots && !bookingForm.slotId) return;

        setBookingState('loading');

        try {
            const payload: any = {
                event_id: selectedEvent.id,
                name: bookingForm.name,
                email: bookingForm.email
            };

            if (selectedEvent.custom_category === 'project_showcase') {
                payload.registration_no = bookingForm.registration_no;
                payload.department = bookingForm.department;
                payload.year = bookingForm.year;
                payload.section = bookingForm.section;
                payload.clan = bookingForm.clan;
                payload.project_title = bookingForm.project_title;
                payload.project_category = bookingForm.project_category;
                payload.project_description = bookingForm.project_description;
            }

            const { data: regData, error: regError } = await supabase
                .from('event_registrations')
                .insert(payload)
                .select()
                .single();

            if (regError) throw regError;

            // 2. Safely book the slot using our RPC
            if (selectedEvent.has_slots) {
                try {
                    await bookSlot(selectedEvent.id, bookingForm.slotId, bookingForm.email, regData.id);
                    fetchSlots(selectedEvent.id, bookingDay);
                } catch (rpcError: any) {
                    await supabase.from('event_registrations').delete().eq('id', regData.id);
                    throw rpcError;
                }
            }

            // 3. Real-time auto-sync to Live Google Sheet Webhook if configured
            const { webhookUrl } = getGoogleSheetsConfig();
            if (webhookUrl) {
                const selectedSlot = availableSlots.find(s => s.id === bookingForm.slotId);
                const slotTimeStr = selectedSlot ? `${formatTime12h(selectedSlot.start_time)} - ${formatTime12h(selectedSlot.end_time)}` : '-';

                sendDataToGoogleSheetWebhook(webhookUrl, {
                    userName: bookingForm.name,
                    userEmail: bookingForm.email,
                    slotTime: slotTimeStr,
                    day: bookingDay,
                    regNo: bookingForm.registration_no || '-',
                    department: bookingForm.department || '-',
                    yearSection: bookingForm.year ? `Yr ${bookingForm.year} Sec ${bookingForm.section || ''}` : '-',
                    clan: bookingForm.clan || '-',
                    projectTitle: bookingForm.project_title || '-',
                    projectCategory: bookingForm.project_category || '-',
                    projectDescription: bookingForm.project_description || '-'
                }).catch(e => console.error('Google Sheet Webhook auto-sync error:', e));
            }

            setBookingState('success');
            setBookingMsg('Quest log stamped successfully! Your spot is secured.');

        } catch (err: any) {
            setBookingState('error');
            setBookingMsg(err.message || 'Error securing registration.');
        }
    };

    if (loading) {
        return (
            <div className="relative min-h-screen bg-[#0d1117] flex justify-center items-center">
                 <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!selectedEvent && !loading) {
        return (
            <div className="relative min-h-screen bg-[#0d1117] flex flex-col justify-center items-center font-cinzel">
                 <h2 className="text-red-500 text-2xl mb-4">Event Not Found</h2>
                 <button onClick={() => navigate('/newevents')} className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">Return to Events</button>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-[#0d1117] font-sans selection:bg-amber-400 selection:text-black">
            <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.boot.dev/img/bg-blue-gray.webp")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
            
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <FantasyNavbar />

            <div className="relative z-10 w-full pt-24 lg:pt-32 px-4 xl:px-8 pb-24 flex justify-center">
                <div className="w-full max-w-3xl">
                    <button onClick={() => navigate('/newevents')} className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm font-bold uppercase tracking-widest font-cinzel transition-colors mb-8">
                        <ArrowLeft size={16} /> Retreat to Raids
                    </button>

                    <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-900/20 rounded-full blur-3xl pointer-events-none"></div>

                        <h2 className="text-3xl font-cinzel font-bold text-white mb-2">{selectedEvent?.title}</h2>
                        <p className="text-slate-400 mb-8 font-lato text-sm">
                            {selectedEvent?.has_slots ? 'Secure a specific time slot below for this expedition.' : 'Standard Registration for this raid.'}
                        </p>

                        {bookingState === 'success' ? (
                            <div className="p-8 text-center border font-lato border-green-500/30 bg-green-900/20 rounded-xl">
                                <h3 className="text-xl font-cinzel text-green-400 mb-2">Registration Complete</h3>
                                <p className="text-slate-300">{bookingMsg}</p>
                                <button onClick={() => navigate('/newevents')} className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-lg font-cinzel font-bold hover:bg-slate-700 transition-colors uppercase tracking-widest border border-slate-600 shadow-[0_0_15px_rgba(255,255,255,0.05)]">Close Scroll & Return</button>
                            </div>
                        ) : (
                            <form onSubmit={handleBookSubmit} className="space-y-6 font-lato">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Warrior Name</label>
                                        <input 
                                            required
                                            type="text" value={bookingForm.name} onChange={e => setBookingForm({...bookingForm, name: e.target.value})}
                                            className="bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Scroll Address (Email)</label>
                                        <input 
                                            required
                                            type="email" value={bookingForm.email} onChange={e => setBookingForm({...bookingForm, email: e.target.value})}
                                            className="bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* EXTENDED FIELDS for Project Showcase specifically */}
                                {selectedEvent?.custom_category === 'project_showcase' && (
                                    <div className="pt-6 mt-4">
                                        <div className="flex items-center gap-2 mb-6 text-emerald-500 border-b border-white/10 pb-3">
                                            <Sparkles size={18} /> <span className="font-cinzel text-base font-bold uppercase tracking-widest">Project Showcase Protocol</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="flex flex-col space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registration No.</label>
                                                <input required type="text" value={bookingForm.registration_no} onChange={e => setBookingForm({ ...bookingForm, registration_no: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none transition-colors" />
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department</label>
                                                <input required type="text" value={bookingForm.department} onChange={e => setBookingForm({ ...bookingForm, department: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none transition-colors" />
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Year & Section</label>
                                                <div className="flex gap-2">
                                                    <input required type="text" placeholder="Year" value={bookingForm.year} onChange={e => setBookingForm({ ...bookingForm, year: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-white focus:border-emerald-500 outline-none w-1/2 transition-colors" />
                                                    <input required type="text" placeholder="Section" value={bookingForm.section} onChange={e => setBookingForm({ ...bookingForm, section: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-white focus:border-emerald-500 outline-none w-1/2 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clan Affiliation</label>
                                                <input type="text" placeholder="(Optional)" value={bookingForm.clan} onChange={e => setBookingForm({ ...bookingForm, clan: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none transition-colors" />
                                            </div>
                                            <div className="flex flex-col space-y-2 md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Title</label>
                                                <input required type="text" value={bookingForm.project_title} onChange={e => setBookingForm({ ...bookingForm, project_title: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none transition-colors" />
                                            </div>
                                            <div className="flex flex-col space-y-2 md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Category</label>
                                                <input required type="text" placeholder="e.g App Dev, Hardware, AI..." value={bookingForm.project_category} onChange={e => setBookingForm({ ...bookingForm, project_category: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none transition-colors" />
                                            </div>
                                            <div className="flex flex-col space-y-2 md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Description</label>
                                                <textarea required rows={3} value={bookingForm.project_description} onChange={e => setBookingForm({ ...bookingForm, project_description: e.target.value })} className="bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none resize-none transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* IF EVENT HAS SLOTS, SHOW SLOT PICKER */}
                                {selectedEvent?.has_slots && (
                                    <div className="pt-6 border-t border-white/10 mt-6 space-y-5">
                                        
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap"><CalIcon size={14} className="inline mr-2 text-amber-500" /> Expedition Day:</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3].map(d => (
                                                    <button type="button" key={d} onClick={() => setBookingDay(d)} className={`px-5 py-2 rounded-lg text-sm font-bold border transition-colors ${bookingDay === d ? 'bg-amber-900/40 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-black/40 text-slate-400 border-white/10 hover:border-amber-500/30'}`}>Day {d}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-3">
                                            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Select Available Slot</label>
                                            
                                            {slotsLoading ? (
                                                <div className="flex items-center gap-3 p-6 bg-black/40 rounded-xl border border-white/5 text-amber-500 text-sm">
                                                    <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div> Fetching tactical formations...
                                                </div>
                                            ) : availableSlots.length === 0 ? (
                                                <div className="p-6 bg-red-900/10 rounded-xl border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                                                    <Shield size={18} className="text-red-500" />
                                                    No slots forged for this day yet, check another day.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                                    {availableSlots.map(slot => {
                                                        const isFull = slot.spots_remaining <= 0;
                                                        const isSelected = bookingForm.slotId === slot.id;
                                                        return (
                                                            <button 
                                                                type="button"
                                                                key={slot.id}
                                                                disabled={isFull}
                                                                onClick={() => setBookingForm({...bookingForm, slotId: slot.id})}
                                                                className={`p-3 rounded-lg border text-sm font-mono text-center flex flex-col justify-center transition-all ${
                                                                    isFull 
                                                                        ? 'bg-red-950/30 border-red-900/50 text-red-500/50 cursor-not-allowed opacity-50'
                                                                        : isSelected
                                                                            ? 'bg-amber-900/50 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-amber-200 scale-105'
                                                                            : 'bg-black/60 border-white/10 hover:border-amber-500/40 text-slate-300 hover:-translate-y-1'
                                                                }`}
                                                            >
                                                                <span className="font-bold text-lg">{formatTime12h(slot.start_time)}</span>
                                                                <span className={`text-[10px] mt-1 tracking-wider font-bold uppercase ${isFull ? 'text-red-500/50' : 'text-amber-500/70'}`}>
                                                                    {isFull ? 'FULL' : `${slot.spots_remaining} Spots`}
                                                                </span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}

                                {bookingState === 'error' && (
                                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-bold flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                        {bookingMsg}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={bookingState === 'loading' || (selectedEvent?.has_slots ? (!bookingForm.slotId || availableSlots.length === 0) : false)}
                                    className="w-full mt-8 py-4 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-cinzel font-bold tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed justify-center flex items-center gap-3 shadow-[0_5px_20px_rgba(217,119,6,0.2)] hover:shadow-[0_5px_30px_rgba(217,119,6,0.4)]"
                                >
                                    {bookingState === 'loading' ? 'COMMITTING TO LEDGER...' : 'REGISTER FOR QUEST'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

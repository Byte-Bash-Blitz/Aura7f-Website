import React, { useEffect, useState } from 'react';
import { supabase, EventRegistration } from '../../lib/supabase';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EditRegistrationModalProps {
  isOpen: boolean;
  registration: EventRegistration | any | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditRegistrationModal({ isOpen, registration, onClose, onSaved }: EditRegistrationModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    discord_id: '',
    registration_no: '',
    department: '',
    year: '',
    section: '',
    clan: '',
    project_title: '',
    project_category: '',
    project_description: '',
    attending: true
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (registration) {
      // Handles both direct EventRegistration or nested structure
      const target = registration.event_registrations || registration;
      setForm({
        name: target.name || '',
        email: target.email || registration.user_email || '',
        discord_id: target.discord_id || '',
        registration_no: target.registration_no || '',
        department: target.department || '',
        year: target.year || '',
        section: target.section || '',
        clan: target.clan || '',
        project_title: target.project_title || '',
        project_category: target.project_category || 'project_showcase',
        project_description: target.project_description || '',
        attending: target.attending !== undefined && target.attending !== null ? target.attending : true
      });
      setMsg('');
    }
  }, [registration]);

  if (!isOpen || !registration) return null;

  const targetId = (registration.event_registrations && registration.event_registrations.id) || registration.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      // 1. Update event_registrations table
      const { error: regErr } = await supabase
        .from('event_registrations')
        .update({
          name: form.name,
          email: form.email,
          discord_id: form.discord_id || null,
          registration_no: form.registration_no || null,
          department: form.department || null,
          year: form.year || null,
          section: form.section || null,
          clan: form.clan || null,
          project_title: form.project_title || null,
          project_category: form.project_category || null,
          project_description: form.project_description || null,
          attending: form.attending
        })
        .eq('id', targetId);

      if (regErr) throw regErr;

      // 2. If email changed, also update event_slot_registrations table user_email reference
      if (registration.user_email && registration.user_email !== form.email) {
        await supabase
          .from('event_slot_registrations')
          .update({ user_email: form.email })
          .eq('event_registration_id', targetId);
      }

      setMsg('Success: User details updated!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 500);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-2xl bg-[#0d1322] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div>
            <h3 className="text-lg font-semibold text-white">Edit User Registration</h3>
            <p className="text-xs text-slate-400">Modify all option fields for this filled user data.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
          {/* User Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Full Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:border-amber-500/50 outline-none text-sm transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email Address *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:border-amber-500/50 outline-none text-sm transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Reg No.</label>
              <input
                type="text"
                value={form.registration_no}
                onChange={e => setForm({ ...form, registration_no: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-amber-500/50 outline-none transition-colors"
                placeholder="e.g. 22100311"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500/50 outline-none transition-colors"
                placeholder="e.g. CSE"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Year & Section</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  className="w-1/2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none transition-colors"
                  placeholder="Yr (e.g. 3)"
                />
                <input
                  type="text"
                  value={form.section}
                  onChange={e => setForm({ ...form, section: e.target.value })}
                  className="w-1/2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none transition-colors"
                  placeholder="Sec (e.g. A)"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Clan Banner</label>
              <input
                type="text"
                value={form.clan}
                onChange={e => setForm({ ...form, clan: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500/50 outline-none transition-colors"
                placeholder="e.g. Shadow Vanguard"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Discord ID</label>
              <input
                type="text"
                value={form.discord_id}
                onChange={e => setForm({ ...form, discord_id: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white text-sm font-mono focus:border-amber-500/50 outline-none transition-colors"
                placeholder="e.g. user#1234"
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="pt-2 border-t border-white/[0.08] space-y-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Project Showcase Info</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Project Title</label>
                <input
                  type="text"
                  value={form.project_title}
                  onChange={e => setForm({ ...form, project_title: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500/50 outline-none transition-colors"
                  placeholder="Project Name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Category</label>
                <input
                  type="text"
                  value={form.project_category}
                  onChange={e => setForm({ ...form, project_category: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500/50 outline-none transition-colors"
                  placeholder="Category e.g. AI / Web"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Project Description</label>
              <textarea
                rows={3}
                value={form.project_description}
                onChange={e => setForm({ ...form, project_description: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500/50 outline-none transition-colors resize-none"
                placeholder="Brief project details..."
              ></textarea>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
              <input
                type="checkbox"
                checked={form.attending}
                onChange={e => setForm({ ...form, attending: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm font-medium text-slate-200">Confirmed Attendance</span>
            </label>
          </div>

          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${msg.includes('Success') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
              {msg.includes('Success') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {msg}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-lg shadow-amber-600/20 transition-all disabled:opacity-60"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

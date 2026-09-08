import React, { useState, useEffect } from 'react';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  getEmbeddableSheetUrl,
  sendDataToGoogleSheetWebhook,
  syncBatchToGoogleSheet,
  GOOGLE_APPS_SCRIPT_TEMPLATE
} from '../../lib/googleSheetsApi';
import { extractSlotRows } from '../../lib/exportUtils';
import { X, ExternalLink, RefreshCw, Save, Send, Copy, Check, FileSpreadsheet, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSlots?: any[];
  eventTitle?: string;
}

export default function GoogleSheetsModal({ isOpen, onClose, adminSlots = [], eventTitle = 'Event' }: GoogleSheetsModalProps) {
  const [activeTab, setActiveTab] = useState<'viewer' | 'settings' | 'script'>('viewer');
  const [sheetUrl, setSheetUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  
  const [copiedScript, setCopiedScript] = useState(false);
  const [savingMsg, setSavingMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');

  useEffect(() => {
    if (isOpen) {
      const config = getGoogleSheetsConfig();
      setSheetUrl(config.sheetUrl);
      setWebhookUrl(config.webhookUrl);
      setEmbedUrl(getEmbeddableSheetUrl(config.sheetUrl));
      setSavingMsg('');
      setSyncResult('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoogleSheetsConfig({ sheetUrl, webhookUrl });
    setEmbedUrl(getEmbeddableSheetUrl(sheetUrl));
    setSavingMsg('Configuration saved successfully!');
    setTimeout(() => setSavingMsg(''), 3000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      alert('Please enter a Webhook URL first.');
      return;
    }
    setSyncing(true);
    setSyncResult('');
    try {
      const testPayload = {
        userName: 'Test User (Admin Sync Test)',
        userEmail: 'admin-test@aura7f.com',
        slotTime: '10:00 AM - 10:15 AM',
        day: 1,
        regNo: 'TEST-001',
        department: 'CSE',
        yearSection: 'Yr 3 Sec A',
        clan: 'Aura Testers',
        projectTitle: 'Live Google Sheets Integration',
        projectCategory: 'System Check',
        projectDescription: 'Verified real-time streaming to Google Sheet.'
      };
      await sendDataToGoogleSheetWebhook(webhookUrl, testPayload);
      setSyncResult('Success: Test data sent to Google Sheet Webhook!');
    } catch (err: any) {
      setSyncResult('Error testing webhook: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllExistingSlots = async () => {
    if (!webhookUrl) {
      alert('Please enter and save your Google Sheets Webhook URL first.');
      setActiveTab('settings');
      return;
    }

    const rows = extractSlotRows(adminSlots);
    if (rows.length === 0) {
      alert('No slot rows available to sync.');
      return;
    }

    setSyncing(true);
    setSyncResult('');

    try {
      const res = await syncBatchToGoogleSheet(webhookUrl, rows);
      setSyncResult(`Sync complete! ${res.success} rows synced to Google Sheet.`);
    } catch (err: any) {
      setSyncResult('Error during batch sync: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-4xl bg-[#0d1322] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Live Google Sheets Integration</h3>
              <p className="text-xs text-slate-400">View, sync, and auto-stream slot data directly into Google Sheets.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all"
              >
                <ExternalLink size={14} /> Open Link
              </a>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/[0.08] bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('viewer')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'viewer'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet size={15} /> Embedded Viewer
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save size={15} /> Settings & Webhook
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'script'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={15} /> Apps Script Helper
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto font-sans space-y-4">
          
          {/* TAB 1: EMBEDDED VIEWER */}
          {activeTab === 'viewer' && (
            <div className="space-y-4">
              {!embedUrl ? (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <FileSpreadsheet size={48} className="mx-auto text-slate-600 mb-3" />
                  <h4 className="text-base font-semibold text-white">No Google Sheet URL Configured</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                    Paste your Google Sheet link in the Settings tab to embed and view live sheet data directly inside the admin panel.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition-all"
                  >
                    Configure Sheet URL
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.08] p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>Viewing Live Sheet for <strong>{eventTitle}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncAllExistingSlots}
                        disabled={syncing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        <Send size={13} /> {syncing ? 'Syncing...' : 'Sync Current Slots Now'}
                      </button>
                      <button
                        onClick={() => setEmbedUrl(getEmbeddableSheetUrl(sheetUrl) + '?t=' + Date.now())}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                        title="Refresh iframe"
                      >
                        <RefreshCw size={13} /> Refresh View
                      </button>
                    </div>
                  </div>

                  {syncResult && (
                    <div className={`p-3 rounded-lg border text-xs font-medium ${syncResult.includes('Success') || syncResult.includes('complete') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                      {syncResult}
                    </div>
                  )}

                  {/* Iframe */}
                  <div className="relative w-full h-[480px] rounded-xl border border-white/10 overflow-hidden bg-white">
                    <iframe
                      src={embedUrl}
                      title="Google Sheet Live View"
                      className="w-full h-full border-0"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SETTINGS & WEBHOOK */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  1. Google Sheet View Link / URL
                </label>
                <p className="text-xs text-slate-400">
                  Paste any Google Sheets URL (e.g. <code>https://docs.google.com/spreadsheets/d/.../edit</code> or published HTML link).
                </p>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-emerald-500/50 outline-none text-sm transition-colors"
                />
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  2. Google Apps Script Webhook URL (Real-Time Auto-Sync)
                </label>
                <p className="text-xs text-slate-400">
                  Paste your deployed Apps Script Web App URL to automatically stream filled user data to Google Sheets whenever someone books a slot!
                </p>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white font-mono placeholder:text-slate-600 focus:border-amber-500/50 outline-none text-sm transition-colors"
                />
              </div>

              {savingMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  {savingMsg}
                </div>
              )}

              {syncResult && (
                <div className={`p-3 rounded-lg border text-xs font-medium ${syncResult.includes('Success') || syncResult.includes('complete') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                  {syncResult}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={syncing || !webhookUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Send size={14} /> {syncing ? 'Testing...' : 'Test Webhook Connection'}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Save size={15} /> Save Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: APPS SCRIPT HELPER */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <h4 className="text-sm font-semibold text-white">How to Auto-Create & Link a Google Sheet in 3 Easy Steps:</h4>
                <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                  <li>Create a new Google Sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-400 underline">sheets.new</a>.</li>
                  <li>Click <strong>Extensions &gt; Apps Script</strong>, replace any code with the snippet below, and click <strong>Save (💾)</strong>.</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong>, choose type <strong>Web app</strong>, set <em>"Who has access"</em> to <strong>Anyone</strong>, click <strong>Deploy</strong>, and copy the Web App URL!</li>
                </ol>
              </div>

              <div className="relative rounded-xl border border-white/10 bg-[#080c14] p-4 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between mb-3 border-b border-white/[0.08] pb-2">
                  <span className="text-emerald-400 font-semibold">Google Apps Script Code Snippet</span>
                  <button
                    onClick={handleCopyScript}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-all"
                  >
                    {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                    {copiedScript ? 'Copied Code!' : 'Copy Code'}
                  </button>
                </div>
                <pre className="max-h-64 overflow-y-auto leading-relaxed text-slate-300">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

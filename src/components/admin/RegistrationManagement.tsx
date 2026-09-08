import React, { useEffect, useState } from 'react'
import { supabase, Event, EventRegistration } from '../../lib/supabase'
import Modal, { ConfirmDialog } from '../ui/Modal'
import { formatTime12h } from '../../lib/utils'
import EditRegistrationModal from './EditRegistrationModal'
import GoogleSheetsModal from './GoogleSheetsModal'
import { exportSlotsToExcel, exportSlotsToPDF } from '../../lib/exportUtils'

export default function RegistrationManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingRegistration, setViewingRegistration] = useState<EventRegistration | null>(null)
  const [editingRegistration, setEditingRegistration] = useState<EventRegistration | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [googleSheetsModalOpen, setGoogleSheetsModalOpen] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchRegistrations(selectedEvent)
    } else {
      setRegistrations([])
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      // Fetch all events (not just upcoming)
      const { data } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'live', 'ended', 'completed'])
        .order('date', { ascending: false })

      setEvents(data || [])
      if (data && data.length > 0) {
        setSelectedEvent(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async (eventId: string) => {
    try {
      const { data } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false })

      setRegistrations(data || [])
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  const handleDeleteRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRegistrations(registrations.filter(r => r.id !== id))
      setConfirmDelete(null)
    } catch (error) {
      console.error('Error deleting registration:', error)
    }
  }

  const handleExportExcel = () => {
    const event = events.find(e => e.id === selectedEvent)
    if (!event) return
    const fakeSlots = [{
      day_number: 1,
      slot_date: event.date,
      start_time: event.time || '10:00:00',
      end_time: event.end_time || '17:00:00',
      capacity: registrations.length,
      registrations: registrations.map(r => ({ event_registrations: r, user_email: r.email }))
    }]
    exportSlotsToExcel(event.title, fakeSlots)
  }

  const handleExportPDF = () => {
    const event = events.find(e => e.id === selectedEvent)
    if (!event) return
    const fakeSlots = [{
      day_number: 1,
      slot_date: event.date,
      start_time: event.time || '10:00:00',
      end_time: event.end_time || '17:00:00',
      capacity: registrations.length,
      registrations: registrations.map(r => ({ event_registrations: r, user_email: r.email }))
    }]
    exportSlotsToPDF(event.title, fakeSlots)
  }

  const exportToCSV = () => {
    if (registrations.length === 0) return

    const event = events.find(e => e.id === selectedEvent)
    const eventTag = event?.tag || ''
    const isProjectShowcase = eventTag.toLowerCase().includes('project') || eventTag.toLowerCase().includes('showcase')
    const isWeeklyBash = eventTag.toLowerCase().includes('bash')

    let headers: string[]
    let rows: string[][]

    if (isProjectShowcase) {
      headers = ['Name', 'Reg No', 'Email', 'Department', 'Year', 'Section', 'Clan', 'Project Title', 'Category', 'Description', 'Registered At']
      rows = registrations.map(r => [
        r.name, r.registration_no || '', r.email, r.department || '', r.year || '', r.section || '',
        r.clan || '', r.project_title || '', r.project_category || '', r.project_description || '',
        new Date(r.registered_at).toLocaleString()
      ])
    } else if (isWeeklyBash) {
      headers = ['Name', 'Email', 'Attending', 'Registered At']
      rows = registrations.map(r => [
        r.name, r.email, r.attending ? 'Yes' : 'No', new Date(r.registered_at).toLocaleString()
      ])
    } else {
      headers = ['Name', 'Email', 'Discord ID', 'Registered At']
      rows = registrations.map(r => [
        r.name, r.email, r.discord_id || 'N/A', new Date(r.registered_at).toLocaleString()
      ])
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${event?.title || 'event'}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getEventTag = () => {
    const event = events.find(e => e.id === selectedEvent)
    return event?.tag || ''
  }

  if (loading) {
    return <div className="text-center text-aura py-8">Loading registrations...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-cyan-400">Event Registrations</h3>
          <p className="text-sm text-gray-400 mt-1">View and manage registrations for all events</p>
        </div>
        
        {events.length > 0 && registrations.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-3.5 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-semibold"
            >
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 px-3.5 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors text-xs font-semibold"
            >
              Export PDF
            </button>
            <button
              onClick={exportToCSV}
              className="bg-green-500/20 border border-green-500/50 text-green-400 px-3.5 py-1.5 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-semibold"
            >
              Export CSV
            </button>
            <button
              onClick={() => setGoogleSheetsModalOpen(true)}
              className="bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 px-3.5 py-1.5 rounded-lg hover:bg-emerald-600/40 transition-colors text-xs font-semibold"
            >
              📊 Live Sheet
            </button>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-slate-900/80 border border-cyan-400/20 rounded-lg p-8 text-center shadow-lg shadow-cyan-500/5">
          <p className="text-aura">No upcoming events with registration available.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-aura text-sm font-medium mb-2">Select Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} - {event.date}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="bg-slate-900/80 border border-cyan-400/20 rounded-lg p-4 shadow-lg shadow-cyan-500/5">
              {(() => {
                const event = events.find(e => e.id === selectedEvent)
                return event ? (
                  <div className="mb-4 pb-4 border-b border-cyan-400/10">
                    <h4 className="text-lg font-bold text-cyan-400">{event.title}</h4>
                    <p className="text-sm text-aura mt-1">
                      📅 {event.date} | 🕐 {formatTime12h(event.time)} | 📍 {event.location}
                    </p>
                    <p className="text-sm text-aura mt-1">
                      📋 {registrations.length}
                      {event.max_registrations && ` / ${event.max_registrations}`} registered
                    </p>
                  </div>
                ) : null
              })()}

              {registrations.length === 0 ? (
                <p className="text-center text-gray-400 py-4">No registrations yet for this event.</p>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg, index) => {
                    const eventTag = getEventTag()
                    const isProjectShowcase = eventTag.toLowerCase().includes('project') || eventTag.toLowerCase().includes('showcase')
                    const isWeeklyBash = eventTag.toLowerCase().includes('bash')

                    return (
                      <div key={reg.id} className="bg-slate-800/50 border border-cyan-400/10 rounded-lg p-3 hover:bg-cyan-400/5 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-cyan-400 font-semibold">{index + 1}. {reg.name}</span>
                              {isWeeklyBash && (
                                <span className={`px-2 py-0.5 rounded text-xs ${reg.attending ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {reg.attending ? '✓ Attending' : '✕ Not Attending'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-aura">{reg.email}</div>
                            {isProjectShowcase && reg.project_title && (
                              <div className="text-sm text-cyan-400/70 mt-1">📁 {reg.project_title}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Registered: {new Date(reg.registered_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingRegistration(reg)}
                              className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setEditingRegistration(reg)}
                              className="text-amber-400 hover:text-amber-300 text-sm px-2 py-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(reg.id)}
                              className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Registration Modal */}
      <EditRegistrationModal
        isOpen={!!editingRegistration}
        registration={editingRegistration}
        onClose={() => setEditingRegistration(null)}
        onSaved={() => {
          if (selectedEvent) {
            fetchRegistrations(selectedEvent)
          }
        }}
      />

      {/* View Registration Modal */}
      {viewingRegistration && (
        <Modal isOpen={true} onClose={() => setViewingRegistration(null)} title="Registration Details" size="md">
          <div className="space-y-3">
            <DetailRow label="Name" value={viewingRegistration.name} />
            <DetailRow label="Email" value={viewingRegistration.email} />
            {viewingRegistration.discord_id && <DetailRow label="Discord ID" value={viewingRegistration.discord_id} />}
            {viewingRegistration.registration_no && <DetailRow label="Registration No" value={viewingRegistration.registration_no} />}
            {viewingRegistration.department && <DetailRow label="Department" value={viewingRegistration.department} />}
            {viewingRegistration.year && <DetailRow label="Year" value={viewingRegistration.year} />}
            {viewingRegistration.section && <DetailRow label="Section" value={viewingRegistration.section} />}
            {viewingRegistration.clan && <DetailRow label="Clan" value={viewingRegistration.clan} />}
            {viewingRegistration.project_title && <DetailRow label="Project Title" value={viewingRegistration.project_title} />}
            {viewingRegistration.project_category && <DetailRow label="Category" value={viewingRegistration.project_category} />}
            {viewingRegistration.project_description && (
              <div>
                <span className="text-gray-400 text-sm">Project Description:</span>
                <p className="text-aura mt-1 bg-black/30 p-3 rounded-lg text-sm">{viewingRegistration.project_description}</p>
              </div>
            )}
            {viewingRegistration.attending !== undefined && viewingRegistration.attending !== null && (
              <DetailRow label="Attending" value={viewingRegistration.attending ? 'Yes' : 'No'} />
            )}
            <DetailRow label="Registered At" value={new Date(viewingRegistration.registered_at).toLocaleString()} />
          </div>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDeleteRegistration(confirmDelete)}
        title="Remove Registration"
        message="Are you sure you want to remove this registration? This action cannot be undone."
        confirmText="Remove"
        type="danger"
      />

      {/* Live Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={googleSheetsModalOpen}
        onClose={() => setGoogleSheetsModalOpen(false)}
        eventTitle={events.find(e => e.id === selectedEvent)?.title || 'Event'}
        adminSlots={registrations.map(r => ({
          day_number: 1,
          slot_date: events.find(e => e.id === selectedEvent)?.date || '',
          start_time: events.find(e => e.id === selectedEvent)?.time || '10:00:00',
          end_time: events.find(e => e.id === selectedEvent)?.end_time || '17:00:00',
          capacity: 1,
          registrations: [{ event_registrations: r, user_email: r.email }]
        }))}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-cyan-400/10">
      <span className="text-gray-400 text-sm">{label}:</span>
      <span className="text-aura">{value}</span>
    </div>
  )
}

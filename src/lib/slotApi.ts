import { supabase, EventSlot, EventSlotRegistration } from './supabase'

/**
 * Lists available slots for an event day
 */
export async function getAvailableSlots(eventId: string, day: number) {
    // We fetch slots then fetch registrations to calculate available count and get user details.
    const { data: slots, error: slotError } = await supabase
        .from('event_slots')
        .select('*')
        .eq('event_id', eventId)
        .eq('day_number', day)
        .order('start_time', { ascending: true })

    if (slotError) throw slotError

    if (!slots || slots.length === 0) return []

    // Fetch all registrations for these slots with full user details
    const slotIds = slots.map(s => s.id)
    const { data: registrations, error: regError } = await supabase
        .from('event_slot_registrations')
        .select(`
            id,
            slot_id,
            event_id,
            user_email,
            event_registrations (
                id, name, email, discord_id, registration_no, department, year, section, clan, project_title, project_category, project_description, attending, registered_at
            )
        `)
        .in('slot_id', slotIds)

    if (regError) throw regError

    // Calculate spots remaining and attach filled user registrations dynamically
    return slots.map(slot => {
        const slotRegs = registrations?.filter(r => r.slot_id === slot.id) || []
        const bookedCount = slotRegs.length
        return {
            ...slot,
            spots_remaining: Math.max(0, slot.capacity - bookedCount),
            registrations: slotRegs
        }
    })
}

/**
 * Books a slot using a safe PostgreSQL RPC block for concurrency.
 */
export async function bookSlot(
    eventId: string,
    slotId: string,
    userEmail: string,
    eventRegistrationId: string
) {
    // Using an RPC function to perform a concurrency-safe row lock!
    const { data, error } = await supabase.rpc('book_event_slot', {
        p_event_id: eventId,
        p_slot_id: slotId,
        p_user_email: userEmail,
        p_event_registration_id: eventRegistrationId
    })

    if (error) {
        throw new Error(error.message)
    }

    return data as EventSlotRegistration
}

/**
 * Cancels a slot booking!
 */
export async function cancelSlot(eventId: string, userEmail: string) {
    const { data, error } = await supabase
        .from('event_slot_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_email', userEmail)
        .select()

    if (error) throw error
    if (!data || data.length === 0) throw new Error('No booking found.')
    return data
}

/**
 * Auto-generates slot rows for a given event, day, and time range.
 * This can be run by an Admin in your NextJS/Vite dashboard.
 */
export async function generateSlots(
    eventId: string,
    dayNumber: number,
    date: string,
    startTime: string,
    endTime: string,
    slotDurationMinutes: number = 15,
    capacity: number = 1
) {
    const startDate = new Date(`${date}T${startTime}:00`)
    const endDate = new Date(`${date}T${endTime}:00`)

    if (startDate >= endDate) {
        throw new Error('Start time must be before end time')
    }

    const slotsToInsert = []
    let currentSlotStart = new Date(startDate)

    while (currentSlotStart < endDate) {
        let currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMinutes * 60000)

        if (currentSlotEnd > endDate) {
            break
        }

        const formatTime = (dateObj: Date) => dateObj.toTimeString().split(' ')[0]

        slotsToInsert.push({
            event_id: eventId,
            day_number: dayNumber,
            slot_date: date,
            start_time: formatTime(currentSlotStart),
            end_time: formatTime(currentSlotEnd),
            capacity: capacity
        })

        currentSlotStart = currentSlotEnd
    }

    const { data, error } = await supabase
        .from('event_slots')
        .insert(slotsToInsert)
        .select()

    if (error) throw error
    return data
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatTime12h } from './utils';

export interface FlattenedSlotRow {
    day: number;
    date: string;
    slotTime: string;
    capacity: number;
    status: string;
    userName: string;
    userEmail: string;
    regNo: string;
    department: string;
    yearSection: string;
    clan: string;
    projectTitle: string;
    projectCategory: string;
    projectDescription: string;
    registeredAt: string;
}

/**
 * Normalizes slot data with nested registrations into flat rows for export.
 */
export function extractSlotRows(slotsData: any[]): FlattenedSlotRow[] {
    const rows: FlattenedSlotRow[] = [];

    slotsData.forEach(slot => {
        const timeRange = `${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}`;
        const regs = slot.registrations || [];

        if (regs.length === 0) {
            rows.push({
                day: slot.day_number || 1,
                date: slot.slot_date || '',
                slotTime: timeRange,
                capacity: slot.capacity || 1,
                status: 'Unbooked',
                userName: '-',
                userEmail: '-',
                regNo: '-',
                department: '-',
                yearSection: '-',
                clan: '-',
                projectTitle: '-',
                projectCategory: '-',
                projectDescription: '-',
                registeredAt: '-'
            });
        } else {
            regs.forEach((r: any) => {
                const details = r.event_registrations || r;
                const yr = details?.year ? `Yr ${details.year}` : '';
                const sec = details?.section ? `Sec ${details.section}` : '';
                const yrSec = [yr, sec].filter(Boolean).join(' ');

                rows.push({
                    day: slot.day_number || 1,
                    date: slot.slot_date || '',
                    slotTime: timeRange,
                    capacity: slot.capacity || 1,
                    status: 'Booked',
                    userName: details?.name || r.user_email || 'Unknown',
                    userEmail: details?.email || r.user_email || '',
                    regNo: details?.registration_no || '-',
                    department: details?.department || '-',
                    yearSection: yrSec || '-',
                    clan: details?.clan || '-',
                    projectTitle: details?.project_title || '-',
                    projectCategory: details?.project_category || '-',
                    projectDescription: details?.project_description || '-',
                    registeredAt: details?.registered_at ? new Date(details.registered_at).toLocaleString() : '-'
                });
            });
        }
    });

    return rows;
}

/**
 * Exports slot data to an Excel (.xlsx) file.
 */
export function exportSlotsToExcel(eventTitle: string, slotsData: any[], dayNumber?: number) {
    const rows = extractSlotRows(slotsData);

    const worksheetData = rows.map(r => ({
        'Day': r.day,
        'Date': r.date,
        'Slot Time': r.slotTime,
        'Status': r.status,
        'User Name': r.userName,
        'User Email': r.userEmail,
        'Reg No': r.regNo,
        'Department': r.department,
        'Year / Section': r.yearSection,
        'Clan': r.clan,
        'Project Title': r.projectTitle,
        'Project Category': r.projectCategory,
        'Project Description': r.projectDescription,
        'Registered At': r.registeredAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Slots Export');

    // Auto-fit column widths
    const maxCols = Object.keys(worksheetData[0] || {}).length;
    worksheet['!cols'] = Array(maxCols).fill({ wch: 20 });

    const cleanTitle = eventTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const dayTag = dayNumber ? `_Day${dayNumber}` : '';
    const fileName = `${cleanTitle}_Slots${dayTag}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
}

/**
 * Exports slot data to a formatted PDF (.pdf) file.
 */
export function exportSlotsToPDF(eventTitle: string, slotsData: any[], dayNumber?: number) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const rows = extractSlotRows(slotsData);

    // Title Header
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`${eventTitle} - Time Slot Overview`, 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    const dayLabel = dayNumber ? `Day ${dayNumber}` : 'All Days';
    doc.text(`Filter: ${dayLabel} | Generated on: ${new Date().toLocaleString()} | Total Entries: ${rows.length}`, 14, 22);

    const tableHeaders = [
        ['Day', 'Time Slot', 'Status', 'User Name', 'Email', 'Reg No', 'Dept / Year', 'Project Title']
    ];

    const tableData = rows.map(r => [
        `Day ${r.day}`,
        r.slotTime,
        r.status,
        r.userName,
        r.userEmail,
        r.regNo,
        `${r.department} (${r.yearSection})`,
        r.projectTitle
    ]);

    autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 27,
        theme: 'grid',
        headStyles: {
            fillColor: [79, 70, 229], // Indigo 600
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59]
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 32 },
            2: { cellWidth: 20 },
            3: { cellWidth: 40 },
            4: { cellWidth: 45 },
            5: { cellWidth: 25 },
            6: { cellWidth: 35 },
            7: { cellWidth: 'auto' }
        }
    });

    const cleanTitle = eventTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const dayTag = dayNumber ? `_Day${dayNumber}` : '';
    const fileName = `${cleanTitle}_Slots${dayTag}_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(fileName);
}

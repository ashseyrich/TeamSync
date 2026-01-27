
import type { ServiceEvent } from '../types.ts';
import { ensureDate } from './performance.ts';

export const downloadIcsFile = (event: ServiceEvent) => {
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Use service start time, not call time, for the calendar primary slot
    const startObj = ensureDate(event.date);
    const startTime = formatDate(startObj);
    
    // Use specified end date, or default to 90 minutes after start
    const endObj = event.endDate ? ensureDate(event.endDate) : new Date(startObj.getTime() + 90 * 60 * 1000);
    const endTime = formatDate(endObj);
    
    const now = formatDate(new Date());

    const description = `Service: ${event.name}\\nCall Time: ${ensureDate(event.callTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\\nLocation: ${event.location?.address || 'No location set'}\\nNotes: ${event.serviceNotes || ''}`;
    const location = event.location?.address || '';

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TeamSync//Media Team Scheduler//EN',
        'BEGIN:VEVENT',
        `UID:${event.id}@teamsync.app`,
        `DTSTAMP:${now}`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${event.name}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.name.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

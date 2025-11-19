
import type { ServiceEvent } from '../types.ts';

export const downloadIcsFile = (event: ServiceEvent) => {
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatDate(new Date(event.callTime));
    // Assume event lasts 2 hours for the calendar placeholder
    const endTime = formatDate(new Date(new Date(event.callTime).getTime() + 2 * 60 * 60 * 1000));
    const now = formatDate(new Date());

    const description = `Service: ${event.name}\\nLocation: ${event.location?.address || 'No location set'}\\nNotes: ${event.serviceNotes || ''}`;
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

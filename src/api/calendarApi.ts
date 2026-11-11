import api from './axios';
import type { CalendarDateResponse, IsoDate } from '../types/api';

export async function getCalendarDate(date: IsoDate): Promise<CalendarDateResponse> {
  const response = await api.get<CalendarDateResponse>(`/calendar/dates/${date}`);

  const day = response.data;
  const note = day?.dailyNote;
  if (day?.date !== date || !Array.isArray(day.events) ||
      !note || note.noteDate !== date ||
      (note.content !== null && typeof note.content !== 'string')) {
    throw new Error('Invalid calendar date response');
  }

  for (const event of day.events) {
    if (!event || !Number.isInteger(event.id) || typeof event.title !== 'string' ||
        typeof event.startDate !== 'string' || typeof event.endDate !== 'string' ||
        typeof event.isAllDay !== 'boolean' || typeof event.isImportant !== 'boolean' ||
        (event.startTime !== null && typeof event.startTime !== 'string') ||
        (event.endTime !== null && typeof event.endTime !== 'string')) {
      throw new Error('Invalid calendar date event');
    }
  }
  return day;
}

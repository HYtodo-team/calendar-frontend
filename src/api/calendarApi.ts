import api from './axios';
import type { CalendarDateResponse, IsoDate } from '../types/api';

export async function getCalendarDate(date: IsoDate): Promise<CalendarDateResponse> {
  const response = await api.get<CalendarDateResponse>(`/calendar/dates/${date}`);

  return response.data;
}

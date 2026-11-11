import api from './axios';
import type { EventCreateRequest, EventDetailResponse, MonthlyEventSummary, EventUpdateRequest, IsoDate } from '../types/api';

interface EventRangeParams {
  from: IsoDate;
  to: IsoDate;
}

export async function createEvent(eventPayload: EventCreateRequest): Promise<EventDetailResponse> {
  const response = await api.post<EventDetailResponse>('/calendar-events', eventPayload);

  return response.data;
}

export async function getEvents({ from, to }: EventRangeParams): Promise<MonthlyEventSummary[]> {
  const response = await api.get<MonthlyEventSummary[]>('/calendar-events', {
    params: { from, to },
  });

  return response.data;
}

export async function getEvent(eventId: number): Promise<EventDetailResponse> {
  const response = await api.get<EventDetailResponse>(`/calendar-events/${eventId}`);

  return response.data;
}

export async function updateEvent(eventId: number, eventPayload: EventUpdateRequest): Promise<EventDetailResponse> {
  const response = await api.patch<EventDetailResponse>(`/calendar-events/${eventId}`, eventPayload);

  return response.data;
}

export async function deleteEvent(eventId: number): Promise<void> {
  await api.delete(`/calendar-events/${eventId}`);
}

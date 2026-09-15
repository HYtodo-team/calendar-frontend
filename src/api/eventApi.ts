import api from './axios';
import type { EventCreateRequest, EventDetailResponse, EventSummary, EventUpdateRequest, IsoDate } from '../types/api';

interface EventRangeParams {
  from: IsoDate;
  to: IsoDate;
}

export async function createEvent(eventPayload: EventCreateRequest): Promise<EventDetailResponse> {
  const response = await api.post<EventDetailResponse>('/calendar-events', eventPayload);

  return response.data;
}

export async function getEvents({ from, to }: EventRangeParams): Promise<EventSummary[]> {
  const response = await api.get<EventSummary[]>('/calendar-events', {
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

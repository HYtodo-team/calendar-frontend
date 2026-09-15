import api from './axios';
import type {
  TimetableDetailResponse,
  TimetableEntryRequest,
  TimetableEntryResponse,
  TimetableEntryUpdateRequest,
  TimetableRequest,
  TimetableResponse,
} from '../types/api';

export async function createTimetable(timetablePayload: Required<TimetableRequest>): Promise<TimetableResponse> {
  const response = await api.post<TimetableResponse>('/timetables', timetablePayload);

  return response.data;
}

export async function getTimetables(): Promise<TimetableResponse[]> {
  const response = await api.get<TimetableResponse[]>('/timetables');

  return response.data;
}

export async function getTimetable(timetableId: number): Promise<TimetableDetailResponse> {
  const response = await api.get<TimetableDetailResponse>(`/timetables/${timetableId}`);

  return response.data;
}

export async function updateTimetable(timetableId: number, timetablePayload: TimetableRequest): Promise<TimetableResponse> {
  const response = await api.patch<TimetableResponse>(`/timetables/${timetableId}`, timetablePayload);

  return response.data;
}

export async function activateTimetable(timetableId: number): Promise<TimetableResponse> {
  const response = await api.patch<TimetableResponse>(`/timetables/${timetableId}/activation`, {
    isActive: true,
  });

  return response.data;
}

export async function deleteTimetable(timetableId: number): Promise<void> {
  await api.delete(`/timetables/${timetableId}`);
}

export async function createTimetableEntry(
  timetableId: number,
  entryPayload: TimetableEntryRequest,
): Promise<TimetableEntryResponse> {
  const response = await api.post<TimetableEntryResponse>(`/timetables/${timetableId}/entries`, entryPayload);

  return response.data;
}

export async function getTimetableEntries(timetableId: number): Promise<TimetableEntryResponse[]> {
  const response = await api.get<TimetableEntryResponse[]>(`/timetables/${timetableId}/entries`);

  return response.data;
}

export async function getTimetableEntry(timetableId: number, entryId: number): Promise<TimetableEntryResponse> {
  const response = await api.get<TimetableEntryResponse>(`/timetables/${timetableId}/entries/${entryId}`);

  return response.data;
}

export async function updateTimetableEntry(
  timetableId: number,
  entryId: number,
  entryPayload: TimetableEntryUpdateRequest,
): Promise<TimetableEntryResponse> {
  const response = await api.patch<TimetableEntryResponse>(
    `/timetables/${timetableId}/entries/${entryId}`,
    entryPayload,
  );

  return response.data;
}

export async function deleteTimetableEntry(timetableId: number, entryId: number): Promise<void> {
  await api.delete(`/timetables/${timetableId}/entries/${entryId}`);
}

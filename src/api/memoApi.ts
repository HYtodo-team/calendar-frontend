import api from './axios';
import type { DailyNoteResponse, IsoDate } from '../types/api';

export async function getDailyNote(date: IsoDate): Promise<DailyNoteResponse> {
  const response = await api.get<DailyNoteResponse>(`/daily-notes/${date}`);

  return response.data;
}

export async function saveDailyNote(date: IsoDate, content: string): Promise<DailyNoteResponse> {
  const response = await api.put<DailyNoteResponse>(`/daily-notes/${date}`, { content });

  return response.data;
}

export async function deleteDailyNote(date: IsoDate): Promise<void> {
  await api.delete(`/daily-notes/${date}`);
}

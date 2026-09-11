import api from './axios';

export async function getTimetable() {
  const response = await api.get('/api/timetable');

  return response.data;
}

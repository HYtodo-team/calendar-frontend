import api from './axios';

export async function getEvents() {
  const response = await api.get('/api/calendar-events');

  return response.data;
}

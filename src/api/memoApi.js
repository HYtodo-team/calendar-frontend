import api from './axios';

export async function getMemo(date) {
  const response = await api.get('/api/memos', {
    params: { date },
  });

  return response.data;
}

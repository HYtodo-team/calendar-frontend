import api from './axios';

export async function getTodos() {
  const response = await api.get('/api/todos');

  return response.data;
}

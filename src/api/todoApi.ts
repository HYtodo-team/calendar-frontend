import api from './axios';
import type { TodoCreateRequest, TodoResponse, TodoUpdateRequest } from '../types/api';

export async function createTodo(todoPayload: TodoCreateRequest): Promise<TodoResponse> {
  const response = await api.post<TodoResponse>('/todos', todoPayload);

  return response.data;
}

export async function getTodos(completed?: boolean): Promise<TodoResponse[]> {
  const response = await api.get<TodoResponse[]>('/todos', {
    params: completed === undefined ? undefined : { completed },
  });

  return response.data;
}

export async function getTodo(todoId: number): Promise<TodoResponse> {
  const response = await api.get<TodoResponse>(`/todos/${todoId}`);

  return response.data;
}

export async function getEventTodos(eventId: number): Promise<TodoResponse[]> {
  const response = await api.get<TodoResponse[]>(`/calendar-events/${eventId}/todos`);

  return response.data;
}

export async function updateTodo(todoId: number, todoPayload: TodoUpdateRequest): Promise<TodoResponse> {
  const response = await api.patch<TodoResponse>(`/todos/${todoId}`, todoPayload);

  return response.data;
}

export async function updateTodoCompletion(todoId: number, isCompleted: boolean): Promise<TodoResponse> {
  const response = await api.patch<TodoResponse>(`/todos/${todoId}/completion`, { isCompleted });

  return response.data;
}

export async function deleteTodo(todoId: number): Promise<void> {
  await api.delete(`/todos/${todoId}`);
}

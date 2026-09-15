import api from './axios';
import type { DashboardSummaryResponse } from '../types/api';

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await api.get<DashboardSummaryResponse>('/dashboard/summary');

  return response.data;
}

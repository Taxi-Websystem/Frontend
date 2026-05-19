import { api } from '../api/axios';

export async function searchCarMakes(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const response = await api.get<string[]>('/vehicle-catalog/makes', {
    params: { query: trimmed }
  });
  return response.data ?? [];
}

export async function searchCarModels(make: string, query: string): Promise<string[]> {
  const makeTrimmed = make.trim();
  const queryTrimmed = query.trim();
  if (!makeTrimmed || queryTrimmed.length < 2) return [];

  const response = await api.get<string[]>('/vehicle-catalog/models', {
    params: { make: makeTrimmed, query: queryTrimmed }
  });
  return response.data ?? [];
}

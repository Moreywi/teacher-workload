import { api } from '../../shared/api/client'
import type { Discipline } from '../../shared/types'

export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data } = await api.get<Discipline[]>('/disciplines')
  return data
}

export async function createDiscipline(name: string): Promise<Discipline> {
  const { data } = await api.post<Discipline>('/disciplines', { name })
  return data
}

export async function updateDiscipline(
  id: string,
  name: string
): Promise<Discipline> {
  const { data } = await api.patch<Discipline>(`/disciplines/${id}`, { name })
  return data
}

export async function deleteDiscipline(id: string): Promise<void> {
  await api.delete(`/disciplines/${id}`)
}
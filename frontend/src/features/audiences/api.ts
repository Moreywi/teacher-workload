import { api } from '../../shared/api/client'

export interface Audience {
  id: string
  name: string
  capacity: number | null
}

export async function fetchAudiences(): Promise<Audience[]> {
  const { data } = await api.get<Audience[]>('/audiences')
  return data
}